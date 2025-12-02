#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod db;
mod models;
mod mt5_client;
mod python_server;
mod service;
mod utils;

use crate::db::DbState;
use python_server::start_python_server;
use std::sync::{Arc, Mutex};
use tauri::WindowEvent;
use std::process::Command;

#[tauri::command]
fn quit_app() {
    std::process::exit(0);
}

fn main() {
    let db = DbState::new().expect("Failed to init database");

    // Python サーバー起動
    let _python_server = match start_python_server() {
        Ok(child) => Some(Arc::new(Mutex::new(child))),
        Err(err) => {
            eprintln!("Failed to start Python server: {}", err);
            None
        }
    };

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![quit_app])
        .manage(db)
        .on_window_event(move |_window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                println!("Close requested: shutting down Python server...");
                api.prevent_close(); // デフォルトの即終了を防ぐ

                #[cfg(windows)]
                {
                    println!("Killing all mt5_server.exe ...");

                    let _ = Command::new("taskkill")
                        .args(&["/IM", "mt5_server.exe", "/F"])
                        .status();

                    println!("All mt5_server.exe processes killed.");
                }

                std::process::exit(0);
            }
        });

    let app = commands::register_commands!(app);

    app.run(tauri::generate_context!())
        .expect("failed to run app");
}
