use crate::db::DbState;
use crate::service::records::{import_csv_to_db,fetch_all_records};
use tauri::State;
use crate::db::models::record::Record;

#[tauri::command]
pub fn insert_record(state: State<DbState>, csv_path: &str) -> Result<(), String> {
    let db = &*state;
    import_csv_to_db(db, csv_path)
}

#[tauri::command]
pub fn get_all_records(state: State<DbState>) -> Result<Vec<Record>, String> {
    let db = &*state;
    fetch_all_records(db)
}
