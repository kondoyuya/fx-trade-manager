use crate::models::db::candle::Candle;
use anyhow::Result;
use reqwest::Client;
use serde::Deserialize;

pub async fn fetch_ohlc(latest_time: i64) -> Result<Vec<Candle>, String> {
    let url = format!(
        "http://127.0.0.1:5000/get_ohlc?since={}&batch_size=1000",
        latest_time
    );
    let resp = Client::new()
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let candles = resp
        .json::<Vec<Candle>>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(candles)
}
