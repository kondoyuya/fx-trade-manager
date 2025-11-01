use crate::db::DbState;
use crate::db::queries::records;
use crate::db::models::record::Record;

pub fn import_csv_to_db(db: &DbState, csv_path: &str) -> Result<(), String> {
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_path(csv_path)
        .map_err(|e| e.to_string())?;

    for result in rdr.records() {
        let row = result.map_err(|e| e.to_string())?;
        let record = Record {
            pair: row.get(0).unwrap_or("").to_string(),
            side: row.get(1).unwrap_or("").to_string(),
            trade_type: row.get(2).unwrap_or("").to_string(),
            lot: row.get(3).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
            rate: row.get(4).unwrap_or("0").parse::<f64>().unwrap_or(0.0),
            profit: row.get(5).and_then(|s| s.parse::<i32>().ok()),
            swap: row.get(6).and_then(|s| s.parse::<i32>().ok()),
            order_time: row.get(8).unwrap_or("").to_string(),
            ..Default::default()
        };
        records::insert_record(db, record)?;
    }

    Ok(())
}

pub fn fetch_all_records(db: &DbState) -> Result<Vec<Record>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, pair, side, trade_type, lot, rate, profit, swap, order_time FROM records")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Record {
                id: row.get(0)?,
                pair: row.get(1)?,
                side: row.get(2)?,
                trade_type: row.get(3)?,
                lot: row.get(4)?,
                rate: row.get(5)?,
                profit: row.get(6)?,
                swap: row.get(7)?,
                order_time: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut records = Vec::new();
    for r in rows {
        records.push(r.map_err(|e| e.to_string())?);
    }
    Ok(records)
}
