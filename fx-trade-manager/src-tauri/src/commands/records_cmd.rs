use crate::db::DbState;
use crate::service::import::{import_csv_to_db, import_candle_to_db};
use crate::service::records::{fetch_all_records, fetch_daily_records};
use tauri::State;
use crate::models::db::record::Record;
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
