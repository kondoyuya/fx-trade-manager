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
        order_time INTEGER,
        UNIQUE(pair, side, trade_type, lot , rate, profit, swap, order_time)
    )
    "#,
    r#"
    CREATE UNIQUE INDEX IF NOT EXISTS idx_records_unique
        ON records(
        pair,
        side,
        trade_type,
        lot,
        rate,
        COALESCE(profit, 0),
        COALESCE(swap, 0),
        order_time
    )
    "#,
    r#"
    CREATE TABLE IF NOT EXISTS candles(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pair TEXT NOT NULL,
        time INTEGER NOT NULL UNIQUE,  -- UNIXTIMEで管理
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        tickvol INTEGER,
        vol INTEGER,
        spread INTEGER,
        UNIQUE(pair, time)
    )
    "#,
    // 注文・決済のペアで管理する
    r#"
    CREATE TABLE IF NOT EXISTS trades(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pair TEXT NOT NULL,
        side TEXT NOT NULL,         -- 買 or 売, エントリーの方向
        lot REAL NOT NULL,
        entry_rate REAL NOT NULL,
        exit_rate REAL NOT NULL,
        entry_time INTEGER NOT NULL,
        exit_time INTEGER NOT NULL,
        profit INTEGER NOT NULL,
        profit_pips INTEGER NOT NULL,
        swap INTEGER,
        memo TEXT,
        -- is_deleted INTEGER DEFAULT 0,
        -- merged_to INTEGER,
        UNIQUE(pair, side, lot , entry_time, exit_time, entry_rate, exit_rate, profit, profit_pips, swap)
    )
    "#,
    r#"
    CREATE UNIQUE INDEX IF NOT EXISTS idx_trades_unique
        ON trades(
        pair,
        side,
        lot,
        entry_time,
        exit_time,
        COALESCE(profit, 0),
        COALESCE(swap, 0)
    )
    "#,
    r#"
    CREATE TABLE IF NOT EXISTS labels(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
    "#,
    r#"
    CREATE TABLE IF NOT EXISTS trade_labels(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id INTEGER NOT NULL,
        label_id INTEGER NOT NULL
    )
    "#,
    r#"
    CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    "#,
];
