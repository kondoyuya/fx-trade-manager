use crate::db::queries::meta;
use crate::db::DbState;

pub fn get_meta(db: &DbState, key: &str) -> Result<Option<String>, String> {
    meta::get_meta(db, key)
}

pub fn set_meta(db: &DbState, key: &str, value: &str) -> Result<(), String> {
    meta::set_meta(db, key, value)
}
