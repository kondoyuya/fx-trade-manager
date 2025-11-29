use crate::models::db::candle::Candle;
use crate::models::db::tick::Tick;
use anyhow::Result;
use reqwest::Client;

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

pub async fn fetch_tick(latest_time: i64) -> Result<Vec<Tick>, String> {
    let url = format!(
        "http://127.0.0.1:5000/get_ticks?symbol=USDJPY&since={}&batch_size=5000",
        latest_time
    );
    let resp = Client::new()
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let ticks = resp
        .json::<Vec<Tick>>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(ticks)
}
