use crate::db::queries::{candles, records, trades};
use crate::db::DbState;
use crate::models::db::candle::Candle;
use crate::models::db::record::Record;
use crate::models::db::trade::Trade;
use crate::utils::time_utils::jst_str_to_unix;
use chrono::{NaiveDateTime, TimeZone, Utc};
use chrono_tz::Europe::Helsinki;
use csv::ReaderBuilder;
use encoding_rs::SHIFT_JIS;
use encoding_rs_io::DecodeReaderBytesBuilder;
use std::collections::VecDeque;
use std::fs::File;

pub fn import_csv_to_db(db: &DbState, csv_path: &str) -> Result<(), String> {
    // SJIS → UTF-8 デコード
    let file = File::open(csv_path).map_err(|e| e.to_string())?;
    let transcoded = DecodeReaderBytesBuilder::new()
        .encoding(Some(SHIFT_JIS))
        .build(file);

    let mut rdr = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(transcoded);

    // ヘッダーで口座の判別
    let expected_headers_dmm = [
        "通貨ペア",
        "売買",
        "区分",
        "数量（Lot）",
        "約定レート",
        "建玉損益（円）",
        "スワップ",
        "決済損益（円）",
        "注文日時",
        "約定日時",
        "注文番号",
        "円転レート",
        "取引手数料",
        "建玉損益",
    ];
    let expected_headers_gmo = [
        "約定日時",
        "取引区分",
        "受渡日",
        "約定番号",
        "銘柄名",
        "銘柄コード",
        "限月",
        "コールプット区分",
        "権利行使価格",
        "権利行使価格通貨",
        "カバードワラント商品種別",
        "売買区分",
        "通貨",
        "受渡通貨",
        "市場",
        "口座",
        "信用区分",
        "約定数量",
        "約定単価",
        "コンバージョンレート",
        "手数料",
        "手数料消費税",
        "建単価",
        "新規手数料",
        "新規手数料消費税",
        "管理費",
        "名義書換料",
        "金利",
        "貸株料",
        "品貸料",
        "前日分値洗",
        "経過利子（円貨）",
        "経過利子（外貨）",
        "経過日数（外債）",
        "所得税（外債）",
        "地方税（外債）",
        "金利・価格調整額（CFD）",
        "配当金調整額（CFD）",
        "金利・価格調整額（くりっく株365）",
        "配当金調整額（くりっく株365）",
        "売建単価（くりっく365/くりっく株365）",
        "買建単価（くりっく365/くりっく株365）",
        "円貨スワップ損益",
        "外貨スワップ損益",
        "約定金額（円貨）",
        "約定金額（外貨）",
        "決済金額（円貨）",
        "決済金額（外貨）",
        "実現損益（円貨）",
        "実現損益（外貨）",
        "実現損益（円換算額）",
        "受渡金額（円貨）",
        "受渡金額（外貨）",
        "備考",
    ];

    let headers = rdr.headers().map_err(|e| e.to_string())?;
    if headers.len() == expected_headers_dmm.len()
        && headers
            .iter()
            .zip(expected_headers_dmm.iter())
            .all(|(a, b)| a == *b)
    {
        println!("DMM形式のCSVです");
        process_dmm_csv(db, rdr)?;
    } else if headers.len() == expected_headers_gmo.len()
        && headers
            .iter()
            .zip(expected_headers_gmo.iter())
            .all(|(a, b)| a == *b)
    {
        println!("GMO形式のCSVです");
        process_gmo_csv(db, rdr)?;
    } else {
        return Err("不明なCSVフォーマットです".to_string());
    }

    Ok(())
}

// DMM用の処理
fn process_dmm_csv(db: &DbState, mut rdr: csv::Reader<impl std::io::Read>) -> Result<(), String> {
    // 売り・買いのポジションスタック（LIFO）
    let mut buy_positions: Vec<Record> = Vec::new();
    let mut sell_positions: Vec<Record> = Vec::new();

    // CSV 全行を取得
    let records: Vec<_> = rdr
        .records()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // 古い順に処理
    for row in records.iter().rev() {
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

        // DBに登録
        records::insert_record(db, &record)?;

        match record.trade_type.as_str() {
            // --------------------------
            // 新規注文 → スタックに push
            // --------------------------
            "新規" => {
                if record.side == "買" {
                    buy_positions.push(record.clone());
                } else if record.side == "売" {
                    sell_positions.push(record.clone());
                }
            }

            // --------------------------
            // 決済注文 → LIFO で処理
            // --------------------------
            "決済" => {
                let stack = if record.side == "買" {
                    &mut sell_positions // 売り建玉を LIFO で決済
                } else {
                    &mut buy_positions // 買い建玉を LIFO で決済
                };

                let mut remaining_lot = record.lot;

                while remaining_lot > 0.0 {
                    if let Some(mut entry) = stack.pop() {
                        let close_lot = remaining_lot.min(entry.lot);
                        let direction = if entry.side == "買" { 1.0 } else { -1.0 };
                        let profit_pips =
                            ((record.rate - entry.rate) * 1000.0 * direction).round() as i32;

                        let trade = Trade {
                            pair: record.pair.clone(),
                            side: entry.side.clone(),
                            lot: close_lot,
                            entry_rate: entry.rate,
                            exit_rate: record.rate,
                            entry_time: entry.order_time,
                            exit_time: record.order_time,
                            profit: record.profit.unwrap_or(0),
                            profit_pips,
                            swap: record.swap,
                            ..Default::default()
                        };

                        trades::insert_trade(db, trade)?;

                        // 部分決済ならスタックに戻す
                        if entry.lot > close_lot {
                            entry.lot -= close_lot;
                            stack.push(entry);
                        }

                        remaining_lot -= close_lot;
                    } else {
                        eprintln!("⚠ 決済に対応する建玉が見つかりません: {:?}", record);
                        break;
                    }
                }
            }

            _ => {}
        }
    }

    Ok(())
}

// GMO用の処理
fn process_gmo_csv(db: &DbState, mut rdr: csv::Reader<impl std::io::Read>) -> Result<(), String> {
    // 売り・買いのポジションキュー
    let mut buy_positions: VecDeque<Record> = VecDeque::new();
    let mut sell_positions: VecDeque<Record> = VecDeque::new();

    let records: Vec<_> = rdr
        .records()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    for row in records.iter() {
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

        // DBに登録
        records::insert_record(db, &record)?;

        match record.trade_type.as_str() {
            "新規" => {
                if record.side == "買" {
                    buy_positions.push_back(record.clone());
                } else if record.side == "売" {
                    sell_positions.push_back(record.clone());
                }
            }
            "決済" => {
                let queue = if record.side == "買" {
                    &mut sell_positions // 売りポジションの決済
                } else {
                    &mut buy_positions // 買いポジションの決済
                };

                let mut remaining_lot = record.lot;

                while remaining_lot > 0.0 {
                    if let Some(mut entry) = queue.pop_front() {
                        let close_lot = remaining_lot.min(entry.lot);
                        let direction = if entry.side == "買" { 1.0 } else { -1.0 };
                        let profit_pips =
                            ((record.rate - entry.rate) * 1000.0 * direction).round() as i32;

                        let trade = Trade {
                            pair: record.pair.clone(),
                            side: entry.side.clone(),
                            lot: close_lot,
                            entry_rate: entry.rate,
                            exit_rate: record.rate,
                            entry_time: entry.order_time,
                            exit_time: record.order_time,
                            profit: record.profit.unwrap_or(0),
                            profit_pips,
                            swap: record.swap,
                            ..Default::default()
                        };

                        trades::insert_trade(db, trade)?;

                        // 部分決済の場合、残りロットを戻す
                        if entry.lot > close_lot {
                            entry.lot -= close_lot;
                            queue.push_front(entry);
                        }

                        remaining_lot -= close_lot;
                    } else {
                        eprintln!("⚠ 決済に対応する建玉が見つかりません: {:?}", record);
                        break;
                    }
                }
            }
            _ => {}
        }
    }

    Ok(())
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
