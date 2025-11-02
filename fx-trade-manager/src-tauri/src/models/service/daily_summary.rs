use serde::{Serialize, Deserialize};
use chrono::{NaiveDate};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DailySummary {
    pub date: NaiveDate,
    pub profit: i32,
    pub count:i32,
}
