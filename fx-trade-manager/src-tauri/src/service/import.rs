use crate::db::DbState;
use crate::db::queries::{records, candles};
use crate::models::db::record::Record;
use crate::models::db::candle::Candle;
use crate::utils::time_utils::{jst_str_to_unix};
use std::fs::File;
use csv::ReaderBuilder;
use chrono::{NaiveDateTime, TimeZone, Utc};

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

        // UNIX秒に変換
        let naive_dt = NaiveDateTime::parse_from_str(&datetime_str, "%Y-%m-%d %H:%M:%S")
            .map_err(|e| e.to_string())?;
        let unix_time = Utc.from_utc_datetime(&naive_dt).timestamp();

        let candle = Candle {
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
