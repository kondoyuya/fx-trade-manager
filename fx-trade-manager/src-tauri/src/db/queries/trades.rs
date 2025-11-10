use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::trade::Trade;

pub fn insert_trade(state: &DbState, trade: Trade) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT INTO OR IGNORE trades (
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

pub fn get_all_trades(state: &DbState) -> Result<Vec<Trade>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = state
        .prepare("SELECT * FROM trades ORDER BY exit_time DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Trade {
                id: row.get(0)?,
                pair: row.get(1)?,
                side: row.get(2)?,
                lot: row.get(3)?,
                entry_rate: row.get(4)?,
                exit_rate: row.get(5)?,
                entry_time: row.get(6)?,
                exit_time: row.get(7)?,
                profit: row.get(8)?,
                profit_pips: row.get(9)?,
                swap: row.get(10)?,
                memo: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut trades = Vec::new();
    for r in rows {
        trades.push(r.map_err(|e| e.to_string())?);
    }
    Ok(trades)
}

pub fn get_trades_by_label(state: &DbState, label_id: i32) -> Result<Vec<Trade>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = state
        .prepare(
            "SELECT * FROM trades 
            WHERE id IN (
                SELECT trade_id FROM trade_labels WHERE label_id = ?1
            )
            ORDER BY exit_time DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![label_id], |row| {
            Ok(Trade {
                id: row.get(0)?,
                pair: row.get(1)?,
                side: row.get(2)?,
                lot: row.get(3)?,
                entry_rate: row.get(4)?,
                exit_rate: row.get(5)?,
                entry_time: row.get(6)?,
                exit_time: row.get(7)?,
                profit: row.get(8)?,
                profit_pips: row.get(9)?,
                swap: row.get(10)?,
                memo: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut trades = Vec::new();
    for r in rows {
        trades.push(r.map_err(|e| e.to_string())?);
    }
    Ok(trades)
}
