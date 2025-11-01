pub const TABLES: &[&str] = &[
    r#"
    CREATE TABLE IF NOT EXISTS records(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pair TEXT NOT NULL,
        side TEXT NOT NULL,         -- 買 or 売
        trade_type TEXT NOT NULL,   -- 新規 or 決済
        lot REAL NOT NULL,
        rate REAL NOT NULL,
        profit INTEGER,
        swap INTEGER,
        order_time TEXT
    )
    "#,
];
