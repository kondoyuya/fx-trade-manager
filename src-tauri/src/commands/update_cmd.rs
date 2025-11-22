use tauri_plugin_updater::UpdaterExt;
use std::process::Command;

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<String>, String> {
    println!("アップデートを確認");
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => {
            println!("新しいバージョンが利用可能: {}", update.version);
            Ok(Some(update.version.to_string()))
        }
        Ok(None) => {
            println!("アップデートはありません");
            Ok(None)
        }
        Err(e) => {
            eprintln!("アップデート確認エラー: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let _ = stop_mt5_server();
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
        app.restart();
    }

    Ok(())
}

fn stop_mt5_server() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("taskkill")
            .args(&["/F", "/IM", "mt5_server.exe"])
            .status()
            .map_err(|e| format!("MT5 終了失敗: {}", e))?;
        if !status.success() {
            return Err("MT5 終了コマンドが失敗しました".into());
        }
    }

    #[cfg(target_os = "linux")]
    {
        let status = Command::new("pkill")
            .arg("mt5_server")
            .status()
            .map_err(|e| format!("MT5 終了失敗: {}", e))?;
        if !status.success() {
            return Err("MT5 終了コマンドが失敗しました".into());
        }
    }

    #[cfg(target_os = "macos")]
    {
        let status = Command::new("pkill")
            .arg("-f")
            .arg("mt5_server")
            .status()
            .map_err(|e| format!("MT5 終了失敗: {}", e))?;
        if !status.success() {
            return Err("MT5 終了コマンドが失敗しました".into());
        }
    }

    Ok(())
}
