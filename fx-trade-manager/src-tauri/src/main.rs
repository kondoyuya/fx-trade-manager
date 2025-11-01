mod db;
// mod commands;

use crate::db::DbState;
// use crate::commands::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbState::new().expect("Failed to init database"))
        // .invoke_handler(tauri::generate_handler![save_profit, get_profits])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
