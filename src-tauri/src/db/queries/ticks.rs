use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::tick::Tick;

pub fn get_latest_time(state: &DbState) -> Result<i64, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let latest_time: Result<i64, _> = conn.query_row(
        "SELECT time FROM ticks ORDER BY time DESC LIMIT 1",
        [],
        |row| row.get(0),
    );

    match latest_time {
        Ok(t) => Ok(t),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(1735689600), // レコードなしは2025年からデータ取得する
        Err(e) => Err(e.to_string()),
    }
}

pub fn insert_ticks_bulk(state: &DbState, ticks: &Vec<Tick>) -> Result<(), String> {
    println!("{}", ticks.len());
    if ticks.is_empty() {
        return Ok(());
    }

    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT OR IGNORE INTO ticks
                (time, time_msc, ask, bid, pair)
                VALUES (?, ?, ?, ?, ?)",
            )
            .map_err(|e| e.to_string())?;

        for t in ticks {
            stmt.execute(params![
                t.time, t.time_msc, t.ask, t.bid, t.pair
            ])
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
