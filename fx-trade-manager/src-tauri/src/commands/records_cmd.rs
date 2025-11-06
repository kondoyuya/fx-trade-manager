use crate::db::DbState;
use crate::service::import::{import_csv_to_db, import_candle_to_db};
use crate::service::records::{fetch_all_records, fetch_daily_records};
use crate::service::candles::{fetch_candles};
use crate::service::labels::{insert_label};
use tauri::State;
use crate::models::db::record::Record;
use crate::models::db::candle::Candle;
use crate::models::service::daily_summary::DailySummary;

#[tauri::command]
pub fn insert_record(state: State<DbState>, csv_path: &str) -> Result<(), String> {
    let db = &*state;
    import_csv_to_db(db, csv_path)
}

#[tauri::command]
pub fn insert_candle(state: State<DbState>, csv_path: &str) -> Result<(), String> {
    let db = &*state;
    import_candle_to_db(db, csv_path)
}

#[tauri::command]
pub fn get_all_records(state: State<DbState>) -> Result<Vec<Record>, String> {
    let db = &*state;
    fetch_all_records(db)
}

#[tauri::command]
pub fn get_daily_records(state: State<DbState>) -> Result<Vec<DailySummary>, String> {
    let db = &*state;
    fetch_daily_records(db)
}

#[tauri::command]
pub fn get_candles(state: State<DbState>) -> Result<Vec<Candle>, String> {
    let db = &*state;
    fetch_candles(db)
}

#[tauri::command]
pub fn add_label(state: State<DbState>, name: &str) -> Result<(), String> {
    let db = &*state;
    insert_label(db, name)
}
