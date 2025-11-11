use tauri::State;
use std::sync::Arc;
use crate::db::DbState;
use crate::{db, mt5_client};
use crate::models::db::candle::Candle;
use crate::db::queries::candles::{ get_latest_time, insert_candles_bulk };

#[tauri::command]
pub async fn fetch_and_update_ohlc(state: State<'_, DbState>) -> Result<String, String> {
    let db = &*state;
    let last_time = get_latest_time(db).map_err(|e| e.to_string())?;
    let candles = mt5_client::fetch_ohlc(last_time).await.map_err(|e| e.to_string())?;
    
    if !candles.is_empty() {
        insert_candles_bulk(db, &candles)?;
    } 

    Ok(format!("Fetched {} candles", candles.len()))
}
