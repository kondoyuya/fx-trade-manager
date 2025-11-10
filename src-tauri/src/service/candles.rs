use rusqlite::Result;
use crate::db::DbState;
use crate::models::db::candle::Candle;

pub fn fetch_candles(db: &DbState) -> Result<Vec<Candle>, String> {
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

    let mut candles = Vec::new();
    for c in iter {
        candles.push(c.map_err(|e| e.to_string())?);
    }

    Ok(candles)
}
