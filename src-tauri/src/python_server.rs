use std::process::{Child, Command, Stdio};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// exe 起動時に venv をセットアップして Python サーバーを起動する
pub fn start_python_server() -> Result<Child, String> {
    let exe_dir = std::env::current_exe()
        .expect("Failed to get exe path")
        .parent()
        .expect("Failed to get exe dir")
        .to_path_buf();

    let server_exe = exe_dir.join("mt5").join("mt5_server.exe");

    // Python サーバー起動
    #[cfg(windows)]
    let child = {
        let mut cmd = Command::new(&server_exe);
        #[cfg(debug_assertions)]
        {
            cmd.arg(&server_exe)
                .stdout(Stdio::inherit()) 
                .stderr(Stdio::inherit()); 
            cmd.spawn().map_err(|e| format!("Failed to start Python server: {}", e))?
        }

        #[cfg(not(debug_assertions))]
        {
            cmd.arg(&server_exe)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .creation_flags(0x08000000)
                .spawn()
                .map_err(|e| format!("Failed to start Python server: {}", e))?
        }
    };

    #[cfg(not(windows))]
    let child = Command::new(&server_exe)
        .arg(&server_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Python server: {}", e))?;
        println!("Python server started (pid = {})", child.id());
    Ok(child)
}
