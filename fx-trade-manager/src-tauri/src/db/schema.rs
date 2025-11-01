pub const TABLES: &[&str] = &[
    r#"
    CREATE TABLE IF NOT EXISTS profits (
        date TEXT PRIMARY KEY,
        amount REAL
    )
    "#,

    r#"
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
    "#,
];