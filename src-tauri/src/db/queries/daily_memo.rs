use rusqlite::{params, Result};

use crate::db::DbState;

pub fn upsert_daily_memo(
    state: &DbState,
    date: &String,
    memo: &String,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO daily_memo (date, memo)
         VALUES (?1, ?2)
         ON CONFLICT(date) DO UPDATE SET memo = excluded.memo",
        params![date, memo],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_daily_memo(state: &DbState, date: &String) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT memo FROM daily_memo WHERE date = ?1")
        .map_err(|e| e.to_string())?;

    let memo = stmt
        .query_map([date], |row| Ok(row.get::<_, String>(0)?))
        .map_err(|e| e.to_string())?
        .collect::<Result<String, _>>()
        .map_err(|e| e.to_string())?;

    Ok(memo)
}
