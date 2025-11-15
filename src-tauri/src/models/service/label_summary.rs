use crate::models::db::trade::Trade;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LabelSummary {
    pub id: i32,                 // ラベルID
    pub name: String,            // ラベル名
    pub profit: i32,             // 総利益
    pub profit_pips: i32,        // 総利益
    pub count: i32,              // トレード回数
    pub wins: i32,               // 勝ちトレード回数
    pub losses: i32,             // 負けトレード回数
    pub win_total: i32,          // 勝ちトレード総額
    pub loss_total: i32,         // 負けトレード総額
    pub total_holding_time: i64, // 合計保有時間
    pub trades: Vec<Trade>,      // トレード一覧
}
