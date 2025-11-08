use rusqlite::{params, Result};

use crate::db::DbState;

pub fn insert_trade_label(state: &DbState, trade_id: i32, label_id: i32) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO trade_labels (
        trade_id, label_id
        ) VALUES (?1, ?2)",
        params![
            trade_id,
            label_id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_trade_label(state: &DbState, trade_id: i32, label_id: i32) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "DELETE FROM trade_labels
        WHERE trade_id = ?1 AND label_id = ?2",
        params![
            trade_id,
            label_id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn find_by_trade_id(db: &DbState, trade_id: i32) -> Result<Vec<i32>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT label_id FROM trade_labels WHERE trade_id = ?1")
        .map_err(|e| e.to_string())?;

    let label_ids = stmt
        .query_map([trade_id], |row| Ok(row.get::<_, i32>(0)?))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<i32>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(label_ids)
}
