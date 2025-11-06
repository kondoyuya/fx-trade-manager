use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Trade {
    pub id: Option<i32>,
    pub pair: String,
    pub side: String,
    pub entry_rate: f64,
    pub exit_rate: f64,
    pub entry_time: i64,
    pub exit_time: i64,
    pub lot: f64,
    pub profit: i32,
    pub profit_pips: i32, // 整数で管理する　ドル円: 1円→1000
    pub swap: Option<i32>,
    pub memo: String,
}
