use std::{
    path::PathBuf,
    process::{Command, Child, Stdio},
    fs,
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

fn get_mt5_dir() -> PathBuf {
    #[cfg(debug_assertions)]
    let exe_dir = std::env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR not set");
    #[cfg(not(debug_assertions))]
    let exe_path = std::env::current_exe().expect("Failed to get exe path");
    let exe_dir = exe_path.parent().expect("Failed to get exe dir");
    PathBuf::from(exe_dir).join("mt5")
}

/// exe 起動時に venv をセットアップして Python サーバーを起動する
pub fn start_python_server() -> Result<Child, String> {
    let mt5_dir = get_mt5_dir();
    let server_path = mt5_dir.join("mt5_server.py");
    let requirements_path = mt5_dir.join("requirements.txt");

    if !server_path.exists() {
        return Err(format!("mt5_server.py not found: {:?}", server_path));
    }
    if !requirements_path.exists() {
        return Err(format!("requirements.txt not found: {:?}", requirements_path));
    }

    let venv_path = mt5_dir.join("venv");
    let first_run = !venv_path.exists();

    // 初回のみ venv 作成と依存インストール
    if first_run {
        println!("First run detected: creating virtual environment and installing dependencies...");

        let status = Command::new("python")
            .args(&["-m", "venv"])
            .arg(&venv_path)
            .status()
            .map_err(|e| format!("Failed to create venv: {}", e))?;
        if !status.success() {
            return Err("Failed to create venv".into());
        }

        let python_exe = if cfg!(windows) {
            venv_path.join("Scripts/python.exe")
        } else {
            venv_path.join("bin/python")
        };
        if !python_exe.exists() {
            return Err(format!("Python executable not found: {:?}", python_exe));
        }

        let status = Command::new(&python_exe)
            .args(&["-m", "ensurepip", "--upgrade"])
            .status()
            .map_err(|e| format!("Failed to run ensurepip: {}", e))?;
        if !status.success() {
            return Err("Failed to install pip with ensurepip".into());
        }

        let status = Command::new(&python_exe)
            .args(&["-m", "pip", "install", "-r"])
            .arg(&requirements_path)
            .status()
            .map_err(|e| format!("Failed to install dependencies: {}", e))?;
        if !status.success() {
            return Err("Failed to install Python dependencies".into());
        }

        println!("Python environment setup complete!");
    } else {
        println!("venv already exists, skipping setup");
    }

    // Python 実行ファイル
    let python_exe = if cfg!(windows) {
        venv_path.join("Scripts/python.exe")
    } else {
        venv_path.join("bin/python")
    };

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
