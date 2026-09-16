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
use std::process::Command;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::path::PathBuf;

use rodio::{Decoder, OutputStreamBuilder, Sink};
use tauri::WindowEvent;

#[tauri::command]
fn quit_app() {
    std::process::exit(0);
}

fn play_sound(path: &PathBuf) {
    eprintln!("[TimeSignal] play_sound() called: {:?}", path);

    if !path.exists() {
        eprintln!(
            "[TimeSignal] ERROR: Sound file does not exist: {:?}",
            path
        );
        return;
    }

    eprintln!("[TimeSignal] Sound file exists");

    let Ok(file) = std::fs::File::open(path) else {
        eprintln!("[TimeSignal] ERROR: Failed to open sound file");
        return;
    };

    eprintln!("[TimeSignal] Sound file opened");

    let Ok(source) = Decoder::try_from(file) else {
        eprintln!("[TimeSignal] ERROR: Failed to decode sound file");
        return;
    };

    eprintln!("[TimeSignal] Sound decoded");

    let Ok(stream) = OutputStreamBuilder::open_default_stream() else {
        eprintln!("[TimeSignal] ERROR: Failed to open audio output");
        return;
    };

    eprintln!("[TimeSignal] Audio output opened");

    let sink = Sink::connect_new(stream.mixer());

    sink.append(source);

    eprintln!("[TimeSignal] Sound appended");

    sink.sleep_until_end();

    eprintln!("[TimeSignal] Sound playback finished");
}

fn start_time_signal() {
    eprintln!("[TimeSignal] Starting");

    let resource_dir = match std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|p| p.to_path_buf()))
    {
        Some(path) => path,
        None => {
            eprintln!("[TimeSignal] ERROR: Failed to get executable directory");
            return;
        }
    };

    let sound_path = resource_dir.join("sounds").join("Time_Signal-Beep01.mp3");

    eprintln!("[TimeSignal] Starting");
    eprintln!("[TimeSignal] Resource directory: {:?}", resource_dir);
    eprintln!("[TimeSignal] Time_Signal-Beep01.mp3: {:?}", sound_path);
    eprintln!(
        "[TimeSignal] sound exists: {}",
        sound_path.exists()
    );

    thread::spawn(move || {
        eprintln!("[TimeSignal] Thread started");

        let mut last_second: Option<u64> = None;

        loop {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default();

            let total_seconds = now.as_secs();
            let second = total_seconds % 60;

            if last_second != Some(total_seconds) {
                eprintln!(
                    "[TimeSignal] Current second: {}",
                    second
                );

                last_second = Some(total_seconds);

                match second {
                    57 => {
                        eprintln!(
                            "[TimeSignal] triggered at second {}",
                            second
                        );

                        play_sound(&sound_path);
                    }

                    _ => {}
                }
            }

            thread::sleep(Duration::from_millis(10));
        }
    });
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
        .setup(|_app| {
            eprintln!("[TimeSignal] setup() started");
            start_time_signal();
            eprintln!("[TimeSignal] setup() finished");
            Ok(())
        })
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
