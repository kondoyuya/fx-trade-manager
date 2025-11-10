use serde::Deserialize;
use anyhow::Result;
use crate::models::db::candle::Candle;

pub async fn fetch_ohlc(last_time: i64) -> Result<Vec<Candle>> {
    // MT5側はPython HTTPサーバでJSON返却
    let url = format!("http://127.0.0.1:5000/get_ohlc?since={}", last_time);
    let resp = reqwest::get(&url).await?;
    let text = resp.text().await?;
    println!("RAW RESPONSE: {}", text);
    let candles: Vec<Candle> = serde_json::from_str(&text)?; 
    Ok(candles)
}
