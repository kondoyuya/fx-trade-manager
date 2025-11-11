use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::candle::Candle;

pub fn get_latest_time(state: &DbState) -> Result<i64, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let latest_time: Result<i64, _> = conn.query_row(
        "SELECT time FROM candles ORDER BY time DESC LIMIT 1",
        [],
        |row| row.get(0),
    );

    match latest_time {
        Ok(t) => Ok(t),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(1735689600), // レコードなしは2025年からデータ取得する
        Err(e) => Err(e.to_string()),
    }
}

pub fn insert_candle(state: &DbState, candle: Candle) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO candles (
        type, time, open, high, low, close, tickvol, vol, spread
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            "JPYUSD",
            candle.time,
            candle.open,
            candle.high,
            candle.low,
            candle.close,
            candle.tickvol,
            candle.vol,
            candle.spread
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn insert_candles_bulk(state: &DbState, candles: &Vec<Candle>) -> Result<(), String> {
    if candles.is_empty() {
        return Ok(());
    }

    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT OR IGNORE INTO candles
                (time, open, high, low, close, tickvol, vol, spread, pair)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .map_err(|e| e.to_string())?;

        for c in candles {
            stmt.execute(params![
                c.time,
                c.open,
                c.high,
                c.low,
                c.close,
                c.tickvol,
                c.vol,
                c.spread,
                c.pair
            ])
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
