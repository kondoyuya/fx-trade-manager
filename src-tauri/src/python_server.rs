use std::process::{Command, Child};
use std::path::PathBuf;

// 仮想環境内の Python で requirements.txt をインストール
pub fn ensure_python_environment() {
    let cwd = std::env::current_dir().unwrap();
    let venv_path = cwd.join("../mt5/venv");
    let python_exe = if cfg!(windows) {
        venv_path.join("Scripts/python.exe")
    } else {
        venv_path.join("bin/python")
    };

    // venv が無ければ作成
    if !python_exe.exists() {
        println!("Creating virtual environment...");
        let status = Command::new("python")
            .arg("-m")
            .arg("venv")
            .arg(&venv_path)
            .status()
            .expect("Failed to create virtual environment");

        if !status.success() {
            panic!("Failed to create virtual environment");
        }
    }

    // pip をアップグレード
    let status = Command::new(&python_exe)
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("--upgrade")
        .arg("pip")
        .status()
        .expect("Failed to upgrade pip");
    if !status.success() {
        panic!("Failed to upgrade pip");
    }

    // 必要ライブラリをインストール
    let requirements = cwd.join("../mt5/requirements.txt");
    println!("Installing Python dependencies...");
    let status = Command::new(&python_exe)
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("--upgrade")
        .arg("-r")
        .arg(&requirements)
        .status()
        .expect("Failed to run pip install");

    if !status.success() {
        panic!("Failed to install Python dependencies");
    }
}

// Python サーバーを非同期で起動
pub fn start_python_server() -> Child {
    let script_path = PathBuf::from("../mt5/mt5_server.py");
    let python_exe = if cfg!(windows) {
        "../mt5/venv/Scripts/python.exe"
    } else {
        "../mt5/venv/bin/python"
    };

    Command::new(python_exe)
        .arg(script_path)
        .spawn()
        .expect("Failed to start Python server")
}
