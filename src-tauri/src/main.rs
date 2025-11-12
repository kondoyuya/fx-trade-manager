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
use tauri::{Builder, generate_handler, RunEvent, WindowEvent};
use tauri_plugin_updater::UpdaterExt;
use std::process::{Command, Child};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use python_server::start_python_server;

#[tauri::command]
fn quit_app() {
    std::process::exit(0);
}

fn main() {
    // Python サーバー起動
    let python_server = match start_python_server() {
        Ok(child) => Some(Arc::new(Mutex::new(child))),
        Err(err) => {
            eprintln!("Failed to start Python server: {}", err);
            None
        }
    };

    let python_server_clone = python_server.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![quit_app])
        .manage(DbState::new().expect("Failed to init database"))
        .on_window_event(move |_window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                println!("Close requested: shutting down Python server...");
                api.prevent_close(); // デフォルトの即終了を防ぐ

                if let Some(server) = &python_server_clone {
                    if let Ok(mut child) = server.lock() {
                        if let Err(err) = child.kill() {
                            eprintln!("Failed to kill Python server: {}", err);
                        } else {
                            println!("Python server stopped.");
                        }
                    }
                }

                // Pythonサーバーをkillした後、アプリを終了
                std::process::exit(0);
            }
        });

    let app = commands::register_commands!(app);

    app.run(tauri::generate_context!())
        .expect("failed to run app");
}

