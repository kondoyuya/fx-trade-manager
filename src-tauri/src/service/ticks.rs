use crate::db::DbState;
use crate::db::queries::ticks;
use crate::models::db::tick::Tick;
use rusqlite::Result;

pub fn fetch_ticks(db: &DbState, from: i64, to: i64) -> Result<Vec<Tick>, String> {
    ticks::find_tick_from_unixtime(db, from, to)
}
