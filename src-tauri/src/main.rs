#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod service;
mod commands;
mod db;
mod utils;
mod models;
mod mt5_client;
mod python_server;

use crate::db::DbState;
use tauri::{Builder, generate_handler};
use tauri_plugin_updater::UpdaterExt;
use std::process::{Command, Child};
use std::path::PathBuf;
use python_server::start_python_server;

#[tauri::command]
fn quit_app() {
    std::process::exit(0);
}

fn main() {
    // Python サーバーを起動
    let mut _python_server = start_python_server();

    std::thread::sleep(std::time::Duration::from_secs(1));

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(generate_handler![quit_app])
        .manage(DbState::new().expect("Failed to init database"));

    let app = commands::register_commands!(app);
    app.run(tauri::generate_context!()).expect("failed to run app");

    let _ = _python_server.expect("Failed to start Python server").kill();
}
