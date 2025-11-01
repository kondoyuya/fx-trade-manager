use std::path::PathBuf;
use rusqlite::{Connection, Result};
use std::sync::{Arc, Mutex};

pub mod schema;
pub mod queries;

pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

impl DbState {
    pub fn new() -> Result<Self> {
        #[cfg(debug_assertions)]
        let db_path = PathBuf::from("../records.db");

        #[cfg(not(debug_assertions))]
        let db_path = {
            let proj_dirs = ProjectDirs::from("com", "example", "fx-trade-manager")
                .expect("failed to get app data dir");
            proj_dirs.data_dir().join("records.db")
        };

        // ディレクトリがなければ作成
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).expect("failed to create db directory");
        }

        let conn = Connection::open(&db_path)?;

        // テーブル定義をまとめて初期化
        for table_sql in crate::db::schema::TABLES {
            conn.execute(table_sql, [])?;
        }

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
}
