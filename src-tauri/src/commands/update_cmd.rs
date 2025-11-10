use tauri_plugin_updater::UpdaterExt;

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
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
        app.restart();
    }

    Ok(())
}

