use crate::db::{profit, DbState};
use tauri::State;

#[tauri::command]
pub fn save_profit(state: State<DbState>, date: String, amount: f64) -> Result<(), String> {
    profit::save_profit_to_db(&state, &date, amount)
}

#[tauri::command]
pub fn get_profits(state: State<DbState>) -> Result<Vec<profit::ProfitEntry>, String> {
    profit::get_profits_from_db(&state)
}
