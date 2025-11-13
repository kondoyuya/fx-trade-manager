use serde::{Serialize, Deserialize};
use chrono::{NaiveDate};
use crate::models::db::trade::Trade;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TradeSummary {
    pub trades: Vec<Trade>,   // トレード一覧

    // 統計データ
    pub profit: i32,          // 総利益
    pub profit_pips: i32,          // 総利益
    pub count: i32,           // トレード回数
    pub wins: i32,            // 勝ちトレード回数
    pub losses: i32,          // 負けトレード回数
    pub win_total: i32,       // 勝ちトレード総額
    pub loss_total: i32,      // 負けトレード総額
    pub avg_prpfit_wins: f64, // 勝ちトレード平均額
    pub avg_prpfit_losses: f64, // 負けトレード平均額
    pub avg_prpfit_pips_wins: f64, // 勝ちトレード平均額
    pub avg_prpfit_pips_losses: f64, // 負けトレード平均額
    pub avg_holding_time: f64, // 平均保有時間
    pub avg_holding_time_wins: f64, // 勝ちトレード平均保有時間
    pub avg_holding_time_losses: f64, // 勝ちトレード平均保有時間
}
