use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::trade::Trade;


pub fn insert_trade(state: &DbState, trade: Trade) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT INTO trades (
        pair, side, lot, entry_rate, exit_rate, entry_time, exit_time, profit, profit_pips, swap, memo
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            trade.pair,
            trade.side,
            trade.lot,
            trade.entry_rate,
            trade.exit_rate,
            trade.entry_time,
            trade.exit_time,
            trade.profit,
            trade.profit_pips,
            trade.swap,
            trade.memo
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
