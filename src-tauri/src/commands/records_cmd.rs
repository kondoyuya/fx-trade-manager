use crate::db::DbState;
use crate::models::db::candle::Candle;
use crate::models::db::label::Label;
use crate::models::db::record::Record;
use crate::models::db::trade::Trade;
use crate::models::filter::trade_filter::TradeFilter;
use crate::models::service::daily_summary::DailySummary;
use crate::models::service::label_summary::LabelSummary;
use crate::models::service::trade_summary::TradeSummary;
use tauri::State;

#[tauri::command]
pub fn insert_record(state: State<DbState>, csv_path: &str) -> Result<(), String> {
    let db = &*state;
    crate::service::import::import_csv_to_db(db, csv_path)
}

#[tauri::command]
pub fn insert_candle(state: State<DbState>, csv_path: &str) -> Result<(), String> {
    let db = &*state;
    crate::service::import::import_candle_to_db(db, csv_path)
}

#[tauri::command]
pub fn get_all_records(state: State<DbState>) -> Result<Vec<Record>, String> {
    let db = &*state;
    crate::service::records::fetch_all_records(db)
}

#[tauri::command]
pub fn get_all_trades(state: State<DbState>) -> Result<Vec<Trade>, String> {
    let db = &*state;
    crate::service::records::fetch_all_trades(db)
}

#[tauri::command]
pub fn get_daily_records(state: State<DbState>) -> Result<Vec<DailySummary>, String> {
    let db = &*state;
    crate::service::records::fetch_daily_records(db)
}

#[tauri::command]
pub fn get_candles(state: State<DbState>, interval: i64) -> Result<Vec<Candle>, String> {
    let db = &*state;
    crate::service::candles::fetch_candles(db, interval)
}

#[tauri::command]
pub fn add_label(state: State<DbState>, name: &str) -> Result<(), String> {
    let db = &*state;
    crate::service::labels::insert_label(db, name)
}

#[tauri::command]
pub fn add_trade_label(state: State<DbState>, trade_id: i32, label_id: i32) -> Result<(), String> {
    let db = &*state;
    crate::service::labels::insert_trade_label(db, trade_id, label_id)
}

#[tauri::command]
pub fn delete_trade_label(
    state: State<DbState>,
    trade_id: i32,
    label_id: i32,
) -> Result<(), String> {
    let db = &*state;
    crate::service::labels::delete_trade_label(db, trade_id, label_id)
}

#[tauri::command]
pub fn get_labels_for_trade(state: State<DbState>, trade_id: i32) -> Result<Vec<i32>, String> {
    let db = &*state;
    crate::service::labels::get_labels_for_trade(db, trade_id)
}

#[tauri::command]
pub fn get_all_labels(state: State<DbState>) -> Result<Vec<Label>, String> {
    let db = &*state;
    crate::service::labels::fetch_all_labels(db)
}

#[tauri::command]
pub fn get_all_labels_with_trade(state: State<DbState>) -> Result<Vec<LabelSummary>, String> {
    let db = &*state;
    crate::service::labels::fetch_all_label_with_trade(db)
}

#[tauri::command]
pub fn update_memo(
    state: State<DbState>,
    id: Option<i32>,
    memo_content: String,
) -> Result<(), String> {
    let db = &*state;
    let trade = Trade {
        id: id,
        memo: memo_content,
        ..Default::default()
    };
    crate::service::records::update_trade_memo_by_id(db, trade)
}

#[tauri::command]
pub fn get_filtered_trades_summary(
    state: State<DbState>,
    filter: TradeFilter,
) -> Result<TradeSummary, String> {
    let db = &*state;
    crate::service::trades::get_filtered_trades_summary(db, filter)
}

#[tauri::command]
pub fn merge_trades(state: State<DbState>, ids: Vec<i64>) -> Result<(), String> {
    let db = &*state;
    crate::service::trades::merge_trades(db, ids)
}
