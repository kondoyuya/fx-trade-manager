use tauri::command;
use crate::db::DbState;
use tauri::State;
use crate::{db, mt5_client};
use std::sync::Arc;
use crate::models::db::candle::Candle;

#[command]
pub async fn fetch_and_update_ohlc() -> Result<String, String> {
    // let last_time = db::get_last_time(&pool).await.map_err(|e| e.to_string())?;
    let last_time = 1762743632;
    let candles = mt5_client::fetch_ohlc(last_time).await.map_err(|e| e.to_string())?;
    
    if !candles.is_empty() {
        // db::save_candles(&pool, &candles).await.map_err(|e| e.to_string())?;
        // let last_candle_time = candles.last().unwrap().time;
        // db::update_last_time(&pool, last_candle_time).await.map_err(|e| e.to_string())?;
    } else {
        print!("data is nothing");
    }

    Ok(format!("Fetched {} candles", candles.len()))
}
