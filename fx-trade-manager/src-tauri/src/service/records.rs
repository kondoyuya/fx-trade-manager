use crate::db::DbState;
use crate::db::queries::{ records, trades };
use crate::models::db::record::Record;
use crate::models::db::trade::Trade;
use crate::models::service::daily_summary::DailySummary;
use crate::utils::time_utils::{get_business_date_from_unix};
use std::collections::HashMap;

pub fn fetch_all_records(db: &DbState) -> Result<Vec<Record>, String> {
    records::get_all_records(db)
}

pub fn fetch_all_trades(db: &DbState) -> Result<Vec<Trade>, String> {
    trades::get_all_trades(db)
}


pub fn fetch_daily_records(db: &DbState) -> Result<Vec<DailySummary>, String> {
    let records_result = records::get_all_records(db);

    let records = match records_result {
        Ok(r) => r,
        Err(e) => {
            eprintln!("❌ Failed to load records: {}", e);
            return Err(e);
        }
    };

    let mut map: HashMap<chrono::NaiveDate, DailySummary> = HashMap::new();

    // ひとまず注文と決済が交互に、日を跨がない前提で作る
    for r in records {
        // UNIX TIME → JST 日付
        let date = get_business_date_from_unix(r.order_time);

        let entry = map.entry(date).or_insert(DailySummary {
            date,
            profit: 0,
            count: 0,
            wins: 0,
            losses: 0,
            win_total: 0,
            loss_total: 0,
            total_holding_time: 0,
        });

        entry.profit += r.profit.unwrap_or(0);
        if r.trade_type == "決済" {
            entry.count += 1;
        }

        let profit = r.profit.unwrap_or(0);

        if profit > 0 {
            entry.wins += 1;
            entry.win_total += profit;
        } else if profit < 0 {
            entry.losses += 1;
            entry.loss_total += profit;
        }
    }

    let mut summary: Vec<DailySummary> = map.into_iter().map(|(_, v)| v).collect();
    summary.sort_by_key(|s| s.date);

    Ok(summary)
}

pub fn update_trade_memo_by_id(db: &DbState, trade: Trade) -> Result<(), String> {
    trades::update_trade_memo_by_id(db, trade)
}