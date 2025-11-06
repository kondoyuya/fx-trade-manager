use crate::db::DbState;
use crate::db::queries::labels;
use crate::models::db::label::Label;

pub fn insert_label(db: &DbState, name: &str) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();

    conn.execute("INSERT INTO labels (name) VALUES (?)", [&name])
        .map_err(|e| e.to_string())?;

    Ok(())
}
