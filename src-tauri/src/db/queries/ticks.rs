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

pub fn find_tick_from_unixtime(state: &DbState, from: i64, to: i64) -> Result<Vec<Tick>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let sql = r#"
        SELECT pair, time, time_msc, bid, ask
        FROM ticks
        WHERE time_msc BETWEEN ?1 AND ?2
        ORDER BY time_msc ASC
    "#;

    let mut stmt = conn.prepare(sql).map_err(|e| format!("prepare error: {}", e))?;
    let rows = stmt
        .query_map(params![from, to], |row| {
            Ok(Tick {
                pair: row.get(0)?,
                time: row.get(1)?,
                time_msc: row.get(2)?,
                bid: row.get(3)?,
                ask: row.get(4)?,
            })
        })
        .map_err(|e| format!("query_map error: {}", e))?;

    let mut ticks: Vec<Tick> = Vec::new();
    for row_result in rows {
        let tick = row_result.map_err(|e| format!("row error: {}", e))?;
        ticks.push(tick);
    }

    Ok(ticks)
}
