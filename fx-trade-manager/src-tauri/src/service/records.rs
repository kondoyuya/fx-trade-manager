use crate::db::DbState;
use crate::db::queries::records;
use crate::models::db::record::Record;
use crate::utils::time_utils::jst_str_to_unix;

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
