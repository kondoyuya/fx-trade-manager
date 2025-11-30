use crate::db::DbState;
use crate::db::queries::daily_memo;
use rusqlite::Result;

pub fn upsert_daily_memo(db: &DbState, date: &String, memo: &String) -> Result<(), String> {
    daily_memo::upsert_daily_memo(db, date, memo)
}

pub fn get_daily_memo(db: &DbState, date: &String) -> Result<String, String> {
    daily_memo::get_daily_memo(db, date)
}
