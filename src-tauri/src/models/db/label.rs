use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Label {
    pub id: Option<i32>,
    pub name: String,
}
