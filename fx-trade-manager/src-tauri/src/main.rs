use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};

#[derive(Serialize, Deserialize, Debug)]
struct ProfitEntry {
    date: String,
    amount: f64,
}

struct DbState {
    conn: Arc<Mutex<Connection>>,
}

impl DbState {
    fn new() -> Result<Self> {
        let db_path = PathBuf::from("profits.db");

        let conn = Connection::open(db_path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS profits (
                date TEXT PRIMARY KEY,
                amount REAL
            )",
            [],
        )?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
}

#[tauri::command]
fn save_profit(state: State<DbState>, date: String, amount: f64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO profits (date, amount)
         VALUES (?1, ?2)
         ON CONFLICT(date) DO UPDATE SET amount = excluded.amount",
        params![date, amount],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_profits(state: State<DbState>) -> Result<Vec<ProfitEntry>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT date, amount FROM profits ORDER BY date ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ProfitEntry {
                date: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut profits = Vec::new();
    for r in rows {
        profits.push(r.map_err(|e| e.to_string())?);
    }
    Ok(profits)
}

fn main() {
    tauri::Builder::default()
        .manage(DbState::new().expect("Failed to init database"))
        .invoke_handler(tauri::generate_handler![save_profit, get_profits])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
