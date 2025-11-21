use crate::db::DbState;
use crate::db::queries::meta;

pub struct Migration {
    pub version: &'static str,
    pub sql: &'static str,
}

pub const MIGRATIONS: &[Migration] = &[
    Migration {
        version: "0.7.15",
        sql: r#"
            ALTER TABLE trades ADD COLUMN is_deleted INTEGER DEFAULT 0;
            ALTER TABLE trades ADD COLUMN merged_to INTEGER;
        "#,
    },
    Migration {
        version: "0.7.18",
        sql: r#"
            PRAGMA foreign_keys = OFF;

            DROP INDEX IF EXISTS idx_trades_unique;

            ALTER TABLE trades RENAME TO trades_old;

            CREATE TABLE trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pair TEXT NOT NULL,
                side TEXT NOT NULL,
                lot REAL NOT NULL,
                entry_rate REAL NOT NULL,
                exit_rate REAL NOT NULL,
                entry_time INTEGER NOT NULL,
                exit_time INTEGER NOT NULL,
                profit INTEGER NOT NULL,
                profit_pips INTEGER NOT NULL,
                swap INTEGER,
                memo TEXT,
                is_deleted INTEGER DEFAULT 0,
                merged_to INTEGER,
                account TEXT NOT NULL DEFAULT '',
                UNIQUE(
                    pair, side, lot,
                    entry_time, exit_time,
                    entry_rate, exit_rate,
                    profit, profit_pips,
                    swap, account
                )
            );

            INSERT INTO trades (
                id, pair, side, lot, entry_rate, exit_rate,
                entry_time, exit_time, profit, profit_pips,
                swap, memo, is_deleted, merged_to, account
            )
            SELECT
                id, pair, side, lot, entry_rate, exit_rate,
                entry_time, exit_time, profit, profit_pips,
                swap, memo, is_deleted, merged_to, ''
            FROM trades_old;

            DROP TABLE trades_old;

            PRAGMA foreign_keys = ON;
        "#,
    },
];

pub fn run_migrations(state: &DbState) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let current = match meta::get_meta(&conn, "local_version")? {
        Some(v) => v,
        None => "0.0.0".to_string(),
    };

    for mig in MIGRATIONS {
        if version_lt(&current, &mig.version) {
            conn.execute_batch(mig.sql).map_err(|e| e.to_string())?;
            meta::set_meta(&conn, "local_version", &mig.version)?;
        }
    }

    Ok(())
}

fn version_lt(a: &str, b: &str) -> bool {
    let parse = |v: &str| {
        v.split('.')
            .map(|x| x.parse::<u32>().unwrap_or(0))
            .collect::<Vec<_>>()
    };

    let pa = parse(a);
    let pb = parse(b);

    let max_len = pa.len().max(pb.len());

    for i in 0..max_len {
        let va = *pa.get(i).unwrap_or(&0);
        let vb = *pb.get(i).unwrap_or(&0);
        if va < vb {
            return true;
        } else if va > vb {
            return false;
        }
    }
    false
}
