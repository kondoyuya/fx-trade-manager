use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::label::Label;

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
