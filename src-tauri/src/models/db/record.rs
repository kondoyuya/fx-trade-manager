use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct Record {
    pub id: Option<i32>,
    pub pair: String,
    pub side: String,
    pub trade_type: String,
    pub lot: f64,
    pub rate: f64,
    pub profit: Option<i32>,
    pub swap: Option<i32>,
    pub order_time: i64,
}
