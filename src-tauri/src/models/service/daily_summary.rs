use crate::models::service::trade_summary::TradeSummary;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DailySummary {
    pub date: NaiveDate,
    pub summary: TradeSummary,
}
