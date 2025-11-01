use crate::db::DbState;

mod service;
mod commands;
mod db;
mod utils;
mod models;

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbState::new().expect("Failed to init database"));

    let app = commands::register_commands!(app);
    app.run(tauri::generate_context!()).expect("failed to run app");
}
