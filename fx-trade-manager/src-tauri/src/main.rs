#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use crate::db::DbState;
use tauri::{Builder, generate_handler};
use tauri_plugin_updater::UpdaterExt;

mod service;
mod commands;
mod db;
mod utils;
mod models;

#[tauri::command]
fn quit_app() {
    std::process::exit(0);
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(generate_handler![quit_app])
        .manage(DbState::new().expect("Failed to init database"));

    let app = commands::register_commands!(app);
    app.run(tauri::generate_context!()).expect("failed to run app");
}
