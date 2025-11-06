use rusqlite::{params, Result};

use crate::db::DbState;
use crate::models::db::label::Label;

pub fn insert_label(state: &DbState, name: &String) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO labels (
        name
        ) VALUES (?1)",
        params![
            name
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_labels(state: &DbState, name: &String) -> Result<(), String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    state.execute(
        "INSERT OR IGNORE INTO labels (
        name
        ) VALUES (?1)",
        params![
            name
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
