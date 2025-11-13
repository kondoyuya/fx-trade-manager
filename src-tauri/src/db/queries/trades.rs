use rusqlite::{params, Result, params_from_iter};

use crate::db::DbState;
use crate::models::db::trade::Trade;
use crate::models::filter::trade_filter::TradeFilter;
use crate::utils::time_utils;

pub fn insert_trade(state: &DbState, trade: Trade) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO trades (
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

pub fn update_trade_memo_by_id(state: &DbState, trade: Trade) -> Result<(), String> {

    let conn = state.conn.lock().map_err(|e| e.to_string())?;

        // ベースSQL
    let mut sql = String::from(
        "UPDATE trades SET 
        memo = ?1",
    );

    let mut params: Vec<&dyn rusqlite::ToSql> = vec![
        &trade.memo,
    ];

    // WHERE 句を追加
    sql.push_str(" WHERE id = ?");
    params.push(&trade.id);

    // 実行
    conn.execute(&sql, params.as_slice())
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_by_filter(state: &DbState, filter: TradeFilter) -> Result<Vec<Trade>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut query = String::from("SELECT * FROM trades WHERE 1=1");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    // --- 期間フィルター ---
    if let (Some(start), Some(end)) = (filter.start_date.as_ref(), filter.end_date.as_ref()) {
        let start_str = start.format("%Y-%m-%d").to_string().replace("-", "");
        let end_str = end.format("%Y-%m-%d").to_string().replace("-", "");

        if let Some((start_unix, _)) = time_utils::get_unix_range_from_business_date(&start_str) {
            query.push_str(" AND exit_time >= ?");
            params_vec.push(Box::new(start_unix));
        }

        if let Some((_, end_unix)) = time_utils::get_unix_range_from_business_date(&end_str) {
            query.push_str(" AND exit_time < ?");
            params_vec.push(Box::new(end_unix));
        }
    }

    query.push_str(" ORDER BY exit_time DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(params_vec.iter()), |row| {
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
