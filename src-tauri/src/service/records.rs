use crate::db::queries::{records, trades};
use crate::db::DbState;
use crate::models::db::record::Record;
use crate::models::db::trade::Trade;
use crate::models::service::daily_summary::DailySummary;
use crate::models::service::trade_summary::TradeSummary;
use crate::utils::time_utils::get_business_date_from_unix;
use std::collections::HashMap;

pub fn fetch_all_records(db: &DbState) -> Result<Vec<Record>, String> {
    records::get_all_records(db)
}

pub fn fetch_all_trades(db: &DbState) -> Result<Vec<Trade>, String> {
    trades::get_all_trades(db)
}

pub fn fetch_daily_records(db: &DbState) -> Result<Vec<DailySummary>, String> {
    let trades = trades::get_all_trades(db).map_err(|e| {
        eprintln!("❌ Failed to load trades: {}", e);
        e
    })?;

    // 日付ごとの trades を格納する
    let mut map: HashMap<chrono::NaiveDate, Vec<Trade>> = HashMap::new();

    for r in trades {
        let date = get_business_date_from_unix(r.exit_time);

        // 日付ごとに Vec<Trade> を蓄積
        map.entry(date).or_insert_with(Vec::new).push(r);
    }

    // DailySummary に変換
    let mut summary: Vec<DailySummary> = map
        .into_iter()
        .map(|(date, trades)| DailySummary {
            date,
            summary: TradeSummary::from_trades(trades),
        })
        .collect();

    // 日付順にソート
    summary.sort_by_key(|s| s.date);

    Ok(summary)
}

pub fn update_trade_memo_by_id(db: &DbState, trade: Trade) -> Result<(), String> {
    trades::update_trade_memo_by_id(db, trade)
}
