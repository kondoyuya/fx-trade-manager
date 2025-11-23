use rusqlite::{params, params_from_iter, Result, ToSql};

use crate::db::DbState;
use crate::models::db::trade::Trade;
use crate::models::filter::trade_filter::TradeFilter;
use crate::utils::time_utils;

pub fn insert_trade(state: &DbState, trade: Trade) -> Result<i64, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO trades (
        pair, side, lot, entry_rate, exit_rate, entry_time, exit_time, profit, profit_pips, swap, memo, account
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
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
            trade.memo,
            trade.account,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(state.last_insert_rowid())
}

pub fn get_by_ids(state: &DbState, ids: Vec<i64>) -> Result<Vec<Trade>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    let placeholders = ids
        .iter()
        .map(|_| "?".to_string())
        .collect::<Vec<_>>()
        .join(",");

    let sql = format!(
        "SELECT id, pair, side, lot, entry_rate, exit_rate,
                entry_time, exit_time, profit, profit_pips, swap
        FROM trades
        WHERE is_deleted = 0 AND id IN ({})",
        placeholders
    );

    let mut stmt = state.prepare(&sql).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(ids.clone()), |row| {
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
                ..Default::default()
            })
        })
        .map_err(|e| e.to_string())?;

    let mut trades = Vec::new();
    for r in rows {
        trades.push(r.map_err(|e| e.to_string())?);
    }
    Ok(trades)
}

pub fn find_similar_trades(state: &DbState, trade: Trade) -> Result<Vec<Trade>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;

    let sql = r#"
        SELECT id, pair, side, lot, entry_rate, exit_rate,
                entry_time, exit_time, profit, profit_pips, swap
        FROM trades
        WHERE pair = ?
          AND side = ?
          AND ABS(entry_time - ?) <= 1
          AND ABS(exit_time - ?) <= 1
          AND is_deleted = 0
    "#;

    let mut stmt = state.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([trade.pair, trade.side, trade.entry_time.to_string(), trade.exit_time.to_string()], |row| {
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
                ..Default::default()
            })
        })
        .map_err(|e| e.to_string())?;

    let mut trades = Vec::new();
    for r in rows {
        trades.push(r.map_err(|e| e.to_string())?);
    }
    Ok(trades)
}

pub fn delete_by_ids(state: &DbState, ids: Vec<i64>) -> Result<(), String> {
    if ids.is_empty() {
        return Ok(());
    }

    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let placeholders = std::iter::repeat("?")
        .take(ids.len())
        .collect::<Vec<_>>()
        .join(",");

    let sql = format!(
        "UPDATE trades
         SET is_deleted = 1
         WHERE id IN ({})",
        placeholders
    );

    let params: Vec<&dyn ToSql> = ids.iter().map(|id| id as &dyn ToSql).collect();

    conn.execute(&sql, &params[..]).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn update_merge_to(state: &DbState, ids: Vec<i64>, merge_to: i64) -> Result<(), String> {
    if ids.is_empty() {
        return Ok(());
    }

    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let placeholders = std::iter::repeat("?")
        .take(ids.len())
        .collect::<Vec<_>>()
        .join(",");

    let sql = format!(
        "UPDATE trades
         SET merged_to = ?
         WHERE id IN ({})",
        placeholders
    );

    let mut params: Vec<&dyn rusqlite::ToSql> = Vec::with_capacity(1 + ids.len());
    params.push(&merge_to);
    for id in &ids {
        params.push(id);
    }

    conn.execute(&sql, &params[..]).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_all_trades(state: &DbState) -> Result<Vec<Trade>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = state
        .prepare("SELECT * FROM trades WHERE is_deleted = 0 ORDER BY exit_time DESC")
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
                account: row.get(14)?,
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
            WHERE is_deleted = 0 
            AND id IN (
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
                account: row.get(14)?,
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

    let mut params: Vec<&dyn rusqlite::ToSql> = vec![&trade.memo];

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

    let mut query = String::from("SELECT * FROM trades WHERE is_deleted = 0");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(start_str) = &filter.start_date {
        let start_yyyymmdd = start_str.replace("-", "");
        if let Some((start_unix, _)) =
            time_utils::get_unix_range_from_business_date(&start_yyyymmdd)
        {
            query.push_str(" AND exit_time >= ?");
            params_vec.push(Box::new(start_unix));
        }
    }

    if let Some(end_str) = &filter.end_date {
        let end_yyyymmdd = end_str.replace("-", "");
        if let Some((_, end_unix)) = time_utils::get_unix_range_from_business_date(&end_yyyymmdd) {
            query.push_str(" AND exit_time < ?");
            params_vec.push(Box::new(end_unix));
        }
    }

    // 保有時間（秒）でのフィルター
    if let Some(min_holding) = filter.min_holding_time {
        query.push_str(" AND (exit_time - entry_time) >= ?");
        params_vec.push(Box::new(min_holding));
    }
    if let Some(max_holding) = filter.max_holding_time {
        query.push_str(" AND (exit_time - entry_time) <= ?");
        params_vec.push(Box::new(max_holding));
    }

    query.push_str(" ORDER BY exit_time DESC");
    println!("{}", query);

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
                account: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut trades = Vec::new();
    for r in rows {
        trades.push(r.map_err(|e| e.to_string())?);
    }

    Ok(trades)
}
