use serde::Deserialize;
use chrono::NaiveDate;

#[derive(Debug, Deserialize)]
pub struct TradeFilter {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub min_holding_time: Option<i64>,
    pub max_holding_time: Option<i64>,
}
