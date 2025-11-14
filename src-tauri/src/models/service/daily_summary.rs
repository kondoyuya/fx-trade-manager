use serde::{Serialize, Deserialize};
use chrono::{NaiveDate};
use crate::models::service::trade_summary::TradeSummary;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DailySummary {
    pub date: NaiveDate,
    pub summary: TradeSummary,
}
