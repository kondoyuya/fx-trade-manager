use crate::db::DbState;
use crate::service::meta;
use std::{
    fs,
    path::PathBuf,
    process::{Child, Command, Stdio},
};
use tauri;
use tauri::{generate_context, Context};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

fn get_mt5_dir() -> PathBuf {
    let exe_dir = {
        #[cfg(debug_assertions)]
        {
            PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set"))
        }

        #[cfg(not(debug_assertions))]
        {
            let exe_path = std::env::current_exe().expect("Failed to get exe path");
            exe_path
                .parent()
                .expect("Failed to get exe dir")
                .to_path_buf()
        }
    };

    exe_dir.join("mt5")
}

/// exe 起動時に venv をセットアップして Python サーバーを起動する
pub fn start_python_server(db: &DbState) -> Result<Child, String> {
    // 最後にセットアップされたバージョンを取得
    let context: tauri::Context<tauri::Wry> = generate_context!();
    let current_version: Option<String> = context.config().version.clone();
    let current_version = current_version
        .filter(|v| !v.trim().is_empty()) // 空文字も弾く
        .expect("CURRENT_VERSION is missing in tauri.conf.json");
    println!("Current version: {}", current_version);

    let mt5_dir = get_mt5_dir();
    let server_path = mt5_dir.join("mt5_server.py");
    let requirements_path = mt5_dir.join("requirements.txt");
    let venv_path = mt5_dir.join("venv");
    let python_exe = if cfg!(windows) {
        venv_path.join("Scripts/python.exe")
    } else {
        venv_path.join("bin/python")
    };

    let local_version = meta::get_meta(db, "local_version")?;
    if local_version.as_deref() != Some(&current_version) {
        if !server_path.exists() {
            return Err(format!("mt5_server.py not found: {:?}", server_path));
        }
        if !requirements_path.exists() {
            return Err(format!(
                "requirements.txt not found: {:?}",
                requirements_path
            ));
        }

        if !venv_path.exists() {
            println!("Creating virtual environment...");
            let status = Command::new("python")
                .args(&["-m", "venv"])
                .arg(&venv_path)
                .status()
                .map_err(|e| format!("Failed to create venv: {}", e))?;

            if !status.success() {
                return Err("Failed to create venv".into());
            }
        }

        println!("Installing Python dependencies...");
        let status = Command::new(&python_exe)
            .args(&["-m", "ensurepip", "--upgrade"])
            .status()
            .map_err(|e| format!("Failed to run ensurepip: {}", e))?;
        if !status.success() {
            return Err("Failed to install pip with ensurepip".into());
        }

        let status = Command::new(&python_exe)
            .args(&["-m", "pip", "install", "--upgrade", "pip"])
            .status()
            .map_err(|e| format!("Failed to upgrade pip: {}", e))?;

        if !status.success() {
            return Err("Failed to upgrade pip".into());
        }

        let status = Command::new(&python_exe)
            .args(&["-m", "pip", "install", "-r"])
            .arg(&requirements_path)
            .status()
            .map_err(|e| format!("Failed to install dependencies: {}", e))?;

        if !status.success() {
            return Err("Failed to install Python dependencies".into());
        }
        meta::set_meta(db, "local_version", &current_version)?;
    } else {
        println!("Skip construct venv");
    }

    // Python サーバー起動
    #[cfg(windows)]
    // Windows起動時にコンソールを開かないようにする
    let child = Command::new(&python_exe)
        .arg(&server_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| format!("Failed to start Python server: {}", e))?;

    #[cfg(not(windows))]
    let child = Command::new(&python_exe)
        .arg(&server_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python server: {}", e))?;

    println!("Python server started (pid = {})", child.id());
    Ok(child)
}
