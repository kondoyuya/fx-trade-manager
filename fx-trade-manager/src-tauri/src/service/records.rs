use crate::db::DbState;
use crate::db::queries::records;
use crate::models::db::record::Record;
use crate::models::service::daily_summary::DailySummary;
use crate::utils::time_utils::{jst_str_to_unix, get_business_date_from_unix};
use std::collections::HashMap;

pub fn import_csv_to_db(db: &DbState, csv_path: &str) -> Result<(), String> {
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_path(csv_path)
        .map_err(|e| e.to_string())?;

    for result in rdr.records() {
        let row = result.map_err(|e| e.to_string())?;
        let order_time_str = row.get(8).unwrap_or("").to_string();

        // JST → UNIX TIME に変換
        let order_time_unix = jst_str_to_unix(&order_time_str).unwrap_or(0);

        let record = Record {
            pair: row.get(0).unwrap_or("").to_string(),
            side: row.get(1).unwrap_or("").to_string(),
            trade_type: row.get(2).unwrap_or("").to_string(),
            lot: row.get(3).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
            rate: row.get(4).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
            profit: row.get(5).and_then(|s| s.parse::<i32>().ok()),
            swap: row.get(6).and_then(|s| s.parse::<i32>().ok()),
            order_time: order_time_unix,
            ..Default::default()
        };
        records::insert_record(db, record)?;
    }

    Ok(())
}

pub fn fetch_all_records(db: &DbState) -> Result<Vec<Record>, String> {
    records::get_all_records(db)
}

pub fn fetch_daily_records(db: &DbState) -> Result<Vec<DailySummary>, String> {
    let records_result = records::get_all_records(db);

    let records = match records_result {
        Ok(r) => r,
        Err(e) => {
            eprintln!("❌ Failed to load records: {}", e);
            return Err(e);
        }
    };

    let mut map: HashMap<chrono::NaiveDate, DailySummary> = HashMap::new();

    // ひとまず注文と決済が交互に、日を跨がない前提で作る
    for r in records {
        // UNIX TIME → JST 日付
        let date = get_business_date_from_unix(r.order_time);

        let entry = map.entry(date).or_insert(DailySummary {
            date,
            profit: 0,
            count: 0,
            wins: 0,
            losses: 0,
            win_total: 0,
            loss_total: 0,
            total_holding_time: 0,
        });

        entry.profit += r.profit.unwrap_or(0);
        if r.trade_type == "決済" {
            entry.count += 1;
        }

        let profit = r.profit.unwrap_or(0);

        if profit > 0 {
            entry.wins += 1;
            entry.win_total += profit;
        } else if profit < 0 {
            entry.losses += 1;
            entry.loss_total += profit;
        }
    }

    let mut summary: Vec<DailySummary> = map.into_iter().map(|(_, v)| v).collect();
    summary.sort_by_key(|s| s.date);

    Ok(summary)
}
