use serde::Deserialize;
use chrono::NaiveDate;

#[derive(Debug, Deserialize)]
pub struct TradeFilter {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}
