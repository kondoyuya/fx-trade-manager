mod db;
mod commands;

use crate::db::DbState;
use crate::commands::*;

fn main() {
    tauri::Builder::default()
        .manage(DbState::new().expect("Failed to init database"))
        .invoke_handler(tauri::generate_handler![save_profit, get_profits])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
