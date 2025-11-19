use rusqlite::Connection;

use crate::db::queries::meta;

pub fn get_meta(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    meta::get_meta(conn, key)
}

pub fn set_meta(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    meta::set_meta(conn, key, value)
}
