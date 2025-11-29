use crate::db::queries::{candles, ticks};
use crate::db::DbState;
use crate::mt5_client;
use tauri::State;

#[tauri::command]
pub async fn fetch_and_update_ohlc(state: State<'_, DbState>) -> Result<String, String> {
    let db = &*state;
    let last_time = candles::get_latest_time(db).map_err(|e| e.to_string())?;
    let candles = mt5_client::fetch_ohlc(last_time)
        .await
        .map_err(|e| e.to_string())?;

    if !candles.is_empty() {
        candles::insert_candles_bulk(db, &candles)?;
    }

    Ok(format!("Fetched {} candles", candles.len()))
}

#[tauri::command]
pub async fn fetch_and_update_tick(state: State<'_, DbState>) -> Result<String, String> {
    let db = &*state;
    let last_time = ticks::get_latest_time(db).map_err(|e| e.to_string())?;
    let ticks = mt5_client::fetch_tick(last_time)
        .await
        .map_err(|e| e.to_string())?;

    if !ticks.is_empty() {
        ticks::insert_ticks_bulk(db, &ticks)?;
    }

    Ok(format!("Fetched {} ticks", ticks.len()))
}
