use crate::db::queries::{candles, trades};
use crate::db::DbState;
use crate::models::db::candle::Candle;
use crate::models::db::record::Record;
use crate::models::db::trade::Trade;
use crate::utils::time_utils::jst_str_to_unix;
use chrono::{NaiveDateTime, TimeZone};
use chrono_tz::Europe::Helsinki;
use csv::{ReaderBuilder};
use encoding_rs::SHIFT_JIS;
use encoding_rs_io::DecodeReaderBytesBuilder;
use std::fs::File;

pub fn import_csv_to_db(db: &DbState, csv_paths: Vec<String>) -> Result<(), String> {
    if csv_paths.is_empty() {
        return Err("CSVファイルが選択されていません".to_string());
    }

    #[derive(PartialEq, Eq, Debug)]
    enum AccountType {
        Dmm,
        Gmo,
    }

    let expected_headers_dmm = vec![
        "通貨ペア", "売買", "区分", "数量（Lot）", "約定レート", "建玉損益（円）",
        "スワップ", "決済損益（円）", "注文日時", "約定日時", "注文番号", "円転レート",
        "取引手数料", "建玉損益",
    ];

    let expected_headers_gmo = vec![
        "約定日時", "取引区分", "受渡日", "約定番号", "銘柄名", "銘柄コード",
        "限月", "コールプット区分", "権利行使価格", "権利行使価格通貨",
        "カバードワラント商品種別", "売買区分", "通貨", "受渡通貨", "市場", "口座",
        "信用区分", "約定数量", "約定単価", "コンバージョンレート", "手数料",
        "手数料消費税", "建単価", "新規手数料", "新規手数料消費税", "管理費",
        "名義書換料", "金利", "貸株料", "品貸料", "前日分値洗", "経過利子（円貨）",
        "経過利子（外貨）", "経過日数（外債）", "所得税（外債）", "地方税（外債）",
        "金利・価格調整額（CFD）", "配当金調整額（CFD）",
        "金利・価格調整額（くりっく株365）", "配当金調整額（くりっく株365）",
        "売建単価（くりっく365/くりっく株365）",
        "買建単価（くりっく365/くりっく株365）",
        "円貨スワップ損益", "外貨スワップ損益", "約定金額（円貨）",
        "約定金額（外貨）", "決済金額（円貨）", "決済金額（外貨）",
        "実現損益（円貨）", "実現損益（外貨）", "実現損益（円換算額）",
        "受渡金額（円貨）", "受渡金額（外貨）", "備考",
    ];

    let mut detected_type: Option<AccountType> = None;

    // ① 全 CSV の口座種別をチェック
    for path in &csv_paths {
        let file = File::open(path).map_err(|e| e.to_string())?;
        let transcoded = DecodeReaderBytesBuilder::new()
            .encoding(Some(SHIFT_JIS))
            .build(file);

        let mut rdr = csv::ReaderBuilder::new()
            .has_headers(true)
            .from_reader(transcoded);

        let headers = rdr.headers().map_err(|e| e.to_string())?;

        // DMM 判定
        let is_dmm =
            headers.len() == expected_headers_dmm.len()
                && headers.iter().zip(expected_headers_dmm.iter()).all(|(a, b)| a == *b);

        // GMO 判定
        let is_gmo =
            headers.len() == expected_headers_gmo.len()
                && headers.iter().zip(expected_headers_gmo.iter()).all(|(a, b)| a == *b);

        let current = if is_dmm {
            AccountType::Dmm
        } else if is_gmo {
            AccountType::Gmo
        } else {
            return Err(format!("不明なCSVフォーマットです: {}", path));
        };

        // 最初の CSV の口座種別を保存
        if let Some(ref prev) = detected_type {
            if prev != &current {
                return Err("複数口座のCSVが混在しています。口座ごとに別々にインポートしてください".to_string());
            }
        } else {
            detected_type = Some(current);
        }
    }

    let account_type = detected_type.unwrap();

    println!("a");

    // ② 同一口座が判定されたので、まとめて処理
    let mut all_records = Vec::new();
    for path in csv_paths {
        let file = File::open(&path).map_err(|e| e.to_string())?;
        let transcoded = DecodeReaderBytesBuilder::new()
            .encoding(Some(SHIFT_JIS))
            .build(file);

        let rdr = csv::ReaderBuilder::new()
            .has_headers(true)
            .from_reader(transcoded);

        match account_type {
            AccountType::Dmm => {
                println!("DMM CSV: {}", path);
                all_records.extend(process_dmm_csv(rdr)?);
            }
            AccountType::Gmo => {
                println!("GMO CSV: {}", path);
                all_records.extend(process_gmo_csv(rdr)?);
            }
        }
    }

    all_records.sort_by_key(|r| r.order_time);
    insert_trade(db, all_records)?;

    Ok(())
}

fn insert_trade(db: &DbState, records: Vec<Record>) -> Result<(), String> {
    let mut positions = Vec::new();
    let mut trades =  Vec::new();
    for record in records{
        match record.trade_type.as_str() {
            "新規" => {
                positions.push(record.clone());
            }

            // ペアになるポジションを探す
            "決済" => {
                let direction = if record.side == "買" { 1.0 } else { -1.0 };
                let close_lot = record.lot;
                let profit = record.profit.unwrap_or(0);
                let swap = record.swap.unwrap_or(0);
                let exit_rate = record.rate;

                let expected_entry_rate =
                    exit_rate + (profit - swap) as f64 / (close_lot * 10000.0) * direction;

                if let Some((idx, _pos)) = positions
                    .iter()
                    .cloned()
                    .enumerate()
                    .find(|(_, pos)| {
                        pos.pair == record.pair
                            && pos.side != record.side
                            && (pos.rate - expected_entry_rate).abs() < 0.00001
                    })
                {
                    let mut pos = positions.remove(idx);

                    let entry_rate = pos.rate;
                    let entry_time = pos.order_time;
                    let position_lot = pos.lot;

                    let matched_lot = close_lot.min(position_lot);

                    let profit_pips =
                        ((entry_rate - exit_rate) * 1000.0 * direction).round() as i32;

                    let trade = Trade {
                        pair: record.pair.clone(),
                        side: pos.side.clone(),
                        lot: matched_lot,
                        entry_rate,
                        exit_rate,
                        entry_time,
                        exit_time: record.order_time,
                        profit,
                        profit_pips,
                        swap: Some(swap),
                        account: "DMM".to_string(),
                        ..Default::default()
                    };

                    trades.push(trade);

                    if position_lot > matched_lot {
                        pos.lot = position_lot - matched_lot;
                        positions.push(pos);
                    }
                } else {
                    return Err(format!(
                        "整合性エラー: 決済と一致する建玉が見つかりません: {:?}",
                        record
                    ));
                }
            }

            _ => {}
        }
    }

    for t in trades {
        trades::insert_trade(db, t.clone())?;
        let similar = trades::find_similar_trades(db, t.clone())?;
        if similar.len() >= 2 {
            let ids: Vec<i64> = similar.iter().map(|s| s.id.unwrap_or(0) as i64).collect();
            crate::service::trades::merge_trades(db, ids)?;
        }
    }

    Ok(())
}

// DMM用の処理
fn process_dmm_csv(mut rdr: csv::Reader<impl std::io::Read>) -> Result<Vec<Record>, String> {
    let records_csv: Vec<_> = rdr
        .records()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut records: Vec<Record> = Vec::new();
    for row in records_csv.iter().rev() {
        let order_time_str = row.get(9).unwrap_or("").to_string();
        let order_time_unix = jst_str_to_unix(&order_time_str).unwrap_or(0);

        // CSV → Record 構築
        let record = Record {
            pair: row.get(0).unwrap_or("").to_string(),
            side: row.get(1).unwrap_or("").to_string(),
            trade_type: row.get(2).unwrap_or("").to_string(),
            lot: row.get(3).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
            rate: row.get(4).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
            profit: parse_i32_from_csv(row.get(5).unwrap_or("")),
            swap: parse_i32_from_csv(row.get(6).unwrap_or("")),
            order_time: order_time_unix,
            ..Default::default()
        };
        
        records.push(record);
    }

    Ok(records)
}

// GMO用の処理
fn process_gmo_csv(mut rdr: csv::Reader<impl std::io::Read>) -> Result<Vec<Record>, String> {
    let records_csv: Vec<_> = rdr
        .records()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut records: Vec<Record> = Vec::new();
    for row in records_csv.iter().rev() {
        let trade_type_raw = row.get(1).unwrap_or("").trim();
        // "FXネオ新規" または "FXネオ決済" 以外ならスキップ
        let trade_type = match trade_type_raw {
            "FXネオ新規" => "新規",
            "FXネオ決済" => "決済",
            _ => continue,
        };

        let order_time_str = row.get(0).unwrap_or(""); // 約定日時
        let order_time_unix = jst_str_to_unix(order_time_str).unwrap_or(0);

        let record = Record {
            pair: row.get(4).unwrap_or("").to_string(),  // 銘柄名
            side: row.get(11).unwrap_or("").to_string(), // 売買区分（"買" or "売"）
            trade_type: trade_type.to_string(),
            lot: row.get(17).unwrap_or("0").parse::<f64>().unwrap_or(0.0) / 10000.0, // 約定数量
            rate: row.get(18).unwrap_or("0").parse::<f64>().unwrap_or(0.0),          // 約定単価
            profit: parse_i32_from_csv(row.get(46).unwrap_or("")), // 実現損益（円貨）
            swap: parse_i32_from_csv(row.get(42).unwrap_or("")),   // 円貨スワップ損益
            order_time: order_time_unix,
            ..Default::default()
        };

        records.push(record);
    }

    Ok(records)
}


fn parse_i32_from_csv(s: &str) -> Option<i32> {
    // trim & remove common noise: backslash, commas, currency symbols, whitespace
    let s = s
        .trim()
        .replace('\\', "")
        .replace(',', "")
        .replace('¥', "")
        .replace('￥', "")
        .replace('\u{FF0B}', "+")
        .replace('\u{FF0D}', "-");

    let cleaned = if s.starts_with('(') && s.ends_with(')') {
        format!("-{}", &s[1..s.len() - 1])
    } else {
        s
    };

    // finally parse
    cleaned.parse::<i32>().ok()
}

pub fn import_candle_to_db(db: &DbState, csv_path: &str) -> Result<(), String> {
    let mut rdr = ReaderBuilder::new()
        .delimiter(b'\t')
        .from_reader(File::open(csv_path).map_err(|e| e.to_string())?);

    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        // "2025.08.01" → "2025-08-01"
        let date = record[0].replace(".", "-");
        let time = &record[1];
        let datetime_str = format!("{} {}", date, time);

        // NaiveDateTimeとしてパース（まだタイムゾーンなし）
        let naive_dt = NaiveDateTime::parse_from_str(&datetime_str, "%Y-%m-%d %H:%M:%S")
            .map_err(|e| e.to_string())?;

        // Europe/Helsinki（DST対応）としてローカル→UTC変換
        let local_dt = Helsinki
            .from_local_datetime(&naive_dt)
            .single()
            .ok_or("DST重複または欠落エラー")?;
        let unix_time = local_dt.timestamp();

        let candle = Candle {
            pair: "JPY/USD".to_string(),
            time: unix_time,
            open: record[2].parse::<f64>().unwrap(),
            high: record[3].parse::<f64>().unwrap(),
            low: record[4].parse::<f64>().unwrap(),
            close: record[5].parse::<f64>().unwrap(),
            tickvol: record[6].parse::<i64>().unwrap(),
            vol: record[7].parse::<i64>().unwrap(),
            spread: record[8].parse::<i64>().unwrap(),
        };
        candles::insert_candle(db, candle)?;
    }

    Ok(())
}
