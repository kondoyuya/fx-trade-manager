use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Tick {
    pub pair: String,
    pub time: i64,
    pub time_msc: i64,
    pub bid: f64,
    pub ask: f64,
}
