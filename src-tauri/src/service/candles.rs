use crate::db::DbState;
use crate::models::db::candle::Candle;
use rusqlite::Result;
use std::collections::BTreeMap;

pub fn fetch_candles(db: &DbState, interval: i64) -> Result<Vec<Candle>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT time, open, high, low, close FROM candles ORDER BY time ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Candle {
                time: row.get::<_, i64>(0)?, // UNIX秒
                open: row.get::<_, f64>(1)?,
                high: row.get::<_, f64>(2)?,
                low: row.get::<_, f64>(3)?,
                close: row.get::<_, f64>(4)?,
                ..Default::default()
            })
        })
        .map_err(|e| e.to_string())?;

    let mut raw_candles = Vec::new();
    for c in iter {
        raw_candles.push(c.map_err(|e| e.to_string())?);
    }

    if raw_candles.is_empty() {
        return Ok(Vec::new());
    }

    // --- 集約処理 ---
    let mut grouped: BTreeMap<i64, Vec<&Candle>> = BTreeMap::new();

    for candle in &raw_candles {
        let key = candle.time - (candle.time % interval);
        grouped.entry(key).or_default().push(candle);
    }

    let mut aggregated = Vec::new();
    for (start_time, group) in grouped {
        if group.is_empty() {
            continue;
        }

        let open = group.first().unwrap().open;
        let close = group.last().unwrap().close;
        let high = group.iter().map(|c| c.high).fold(f64::MIN, f64::max);
        let low = group.iter().map(|c| c.low).fold(f64::MAX, f64::min);

        aggregated.push(Candle {
            time: start_time,
            open,
            high,
            low,
            close,
            ..Default::default()
        });
    }

    Ok(aggregated)
}
