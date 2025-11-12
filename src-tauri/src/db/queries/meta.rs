use rusqlite::{params, Result as SqlResult};
use crate::db::DbState;

pub fn get_meta(state: &DbState, key: &str) -> Result<Option<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let result: SqlResult<String> = conn.query_row(
        "SELECT value FROM meta WHERE key = ?1",
        params![key],
        |row| row.get(0),
    );

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

pub fn set_meta(state: &DbState, key: &str, value: &str) -> Result<(), String> {
    let state = state.conn.lock().unwrap();
    state.execute(
        "INSERT INTO meta (key, value) VALUES (?1, ?2)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
