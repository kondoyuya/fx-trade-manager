use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::candle::Candle;

pub fn insert_candle(state: &DbState, candle: Candle) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO candles (
        time, open, high, low, close, tickvol, vol, spread
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
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
