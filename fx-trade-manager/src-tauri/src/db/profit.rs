use crate::db::DbState;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Debug)]
pub struct ProfitEntry {
    pub date: String,
    pub amount: f64,
}

pub fn save_profit_to_db(conn: &DbState, date: &str, amount: f64) -> Result<(), String> {
    let conn = conn.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO profits (date, amount)
         VALUES (?1, ?2)
         ON CONFLICT(date) DO UPDATE SET amount = excluded.amount",
        params![date, amount],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_profits_from_db(conn: &DbState) -> Result<Vec<ProfitEntry>, String> {
    let conn = conn.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT date, amount FROM profits ORDER BY date ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ProfitEntry {
                date: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut profits = Vec::new();
    for r in rows {
        profits.push(r.map_err(|e| e.to_string())?);
    }
    Ok(profits)
}
