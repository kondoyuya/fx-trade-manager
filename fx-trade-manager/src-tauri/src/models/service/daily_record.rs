use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DailyRecord {
    pub profit: i32,
    pub count:i32,
}
