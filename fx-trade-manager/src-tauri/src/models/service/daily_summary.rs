use serde::{Serialize, Deserialize};
use chrono::{NaiveDate};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DailySummary {
    pub date: NaiveDate,
    pub profit: i32,          // 総利益
    pub count: i32,           // トレード回数
    pub wins: i32,            // 勝ちトレード回数
    pub losses: i32,          // 負けトレード回数
    pub win_total: i32,       // 勝ちトレード総額
    pub loss_total: i32,      // 負けトレード総額
    pub total_holding_time: u64, // 合計保有時間
}
