pub mod profit;
pub mod schema;

use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// データベースの状態を管理する構造体
pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

impl DbState {
    /// DB を初期化して DbState を返す
    pub fn new() -> Result<Self> {
        // 開発用と本番用で DB ファイルの場所を切り替える
        #[cfg(debug_assertions)]
        let db_path = PathBuf::from("../records.db");

        #[cfg(not(debug_assertions))]
        let db_path = app_data_dir()
            .expect("failed to get app data dir")
            .join("fx-trade-manager")
            .join("records.db");

        // DB が置かれるディレクトリが存在しなければ作る
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
