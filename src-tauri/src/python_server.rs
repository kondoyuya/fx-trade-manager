use std::{
    path::PathBuf,
    process::{Command, Child, Stdio},
    fs,
};

fn get_mt5_dir() -> PathBuf {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR not set");
    PathBuf::from(manifest_dir).join("mt5")
}

/// exe 起動時に venv をセットアップして Python サーバーを起動する
pub fn start_python_server() -> Result<Child, String> {
    // 1. resources ディレクトリを取得
    let mt5_dir = get_mt5_dir();

    // 2. Python サーバーと requirements.txt のパス
    let server_path = mt5_dir.join("mt5_server.py");
    let requirements_path = mt5_dir.join("requirements.txt");

    if !server_path.exists() {
        return Err(format!("mt5_server.py not found: {:?}", server_path));
    }
    if !requirements_path.exists() {
        return Err(format!("requirements.txt not found: {:?}", requirements_path));
    }

    // 3. venv ディレクトリ
    let venv_path = mt5_dir.join("venv");

    // 4. venv がなければ作成
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

    // 5. Python 実行ファイル
    let python_exe = if cfg!(windows) {
        venv_path.join("Scripts/python.exe")
    } else {
        venv_path.join("bin/python")
    };
    if !python_exe.exists() {
        return Err(format!("Python executable not found: {:?}", python_exe));
    }
    

    // 6. 依存をインストール
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

    // 7. Python サーバーをバックグラウンドで起動
    let child = Command::new(&python_exe)
        .arg(&server_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python server: {}", e))?;

    println!("Python server started (pid = {})", child.id());

    Ok(child)
}
