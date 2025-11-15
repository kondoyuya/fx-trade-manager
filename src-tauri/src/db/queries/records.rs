use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::record::Record;

pub fn insert_record(state: &DbState, record: &Record) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state
        .execute(
            "INSERT OR IGNORE INTO records (
        pair, side, trade_type, lot, rate, profit, swap, order_time
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                record.pair,
                record.side,
                record.trade_type,
                record.lot,
                record.rate,
                record.profit,
                record.swap,
                record.order_time
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_records(state: &DbState) -> Result<Vec<Record>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = state
        .prepare("SELECT * FROM records")
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
