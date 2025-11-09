use serde::{Serialize, Deserialize};
use crate::models::db::trade::Trade;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LabelSummary {
    pub id: Option<i32>,
    pub name: String,
    pub trades: Vec<Trade>,
}
