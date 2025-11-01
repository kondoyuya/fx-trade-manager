use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Record {
    #[serde(rename = "ID")]
    pub id: Option<i32>,
    #[serde(rename = "通貨ペア")]
    pub pair: String,
    #[serde(rename = "売買")]
    pub side: String,
    #[serde(rename = "区分")]
    pub type: String,
    #[serde(rename = "数量（Lot）")]
    pub lot: f64,
    #[serde(rename = "約定レート")]
    pub rate: f64,
    #[serde(rename = "損益")]
    pub profit: Option<i32>,
    #[serde(rename = "スワップ")]
    pub swap: Option<i32>,
    #[serde(rename = "注文日時")]
    pub order_time: String,
}
