use crate::db::queries::trades;
use crate::models::db::trade::Trade;
use crate::models::filter::trade_filter::TradeFilter;
use crate::models::service::trade_summary::TradeSummary;
use crate::DbState;

pub fn get_filtered_trades_summary(
    db: &DbState,
    filter: TradeFilter,
) -> Result<TradeSummary, String> {
    let trades_result = trades::get_by_filter(db, filter);

    let trades = match trades_result {
        Ok(r) => r,
        Err(e) => {
            eprintln!("❌ Failed to load trades: {}", e);
            return Err(e);
        }
    };

    let result = TradeSummary::from_trades(trades);

    Ok(result)
}

pub fn merge_trades(db: &DbState, ids: Vec<i64>) -> Result<(), String> {
    let trades_result = trades::get_by_ids(db, ids.clone());
    let trades = match trades_result {
        Ok(r) => r,
        Err(e) => {
            eprintln!("❌ Failed to load trades: {}", e);
            return Err(e);
        }
    };
    validate(&trades)?;

    let new_trade = merge(&trades);
    dbg!(&new_trade);

    let merge_to_result = trades::insert_trade(db, new_trade);
    let merge_to = match merge_to_result {
        Ok(r) => r,
        Err(e) => {
            eprintln!("❌ Failed to load trades: {}", e);
            return Err(e);
        }
    };

    trades::delete_by_ids(db, ids.clone())?;
    trades::update_merge_to(db, ids.clone(), merge_to)?;

    return Ok(());
}

pub fn validate(trades: &Vec<Trade>) -> Result<(), String> {
    if trades.len() < 2 {
        return Err("マージには2件以上のトレードが必要です".into());
    }

    let first_pair = &trades[0].pair;
    if trades.iter().any(|t| t.pair != *first_pair) {
        return Err("通貨ペアが異なるトレードはマージできません".into());
    }

    let first_side = &trades[0].side;
    if trades.iter().any(|t| t.side != *first_side) {
        return Err("売買方向が異なるトレードはマージできません".into());
    }

    Ok(())
}

fn merge(trades: &Vec<Trade>) -> Trade {
    let total_lot: f64 = trades.iter().map(|t| t.lot).sum();
    let entry_rate_avg =
        (trades.iter().map(|t| t.entry_rate).sum::<f64>() / trades.len() as f64 * 1000.0).round()
            / 1000.0;
    let exit_rate_avg =
        (trades.iter().map(|t| t.exit_rate).sum::<f64>() / trades.len() as f64 * 1000.0).round()
            / 1000.0;
    let entry_time_avg = trades.iter().map(|t| t.entry_time).sum::<i64>() / trades.len() as i64;
    let exit_time_avg = trades.iter().map(|t| t.exit_time).sum::<i64>() / trades.len() as i64;

    let total_profit = trades.iter().map(|t| t.profit).sum();
    let direction = if trades[0].side == "買" { 1.0 } else { -1.0 };
    let total_pips = ((exit_rate_avg - entry_rate_avg) * 1000.0 * direction).round() as i32;
    let total_swap = trades.iter().map(|t| t.swap).sum();

    return Trade {
        pair: trades[0].pair.clone(),
        side: trades[0].side.clone(),
        lot: total_lot,
        entry_rate: entry_rate_avg,
        exit_rate: exit_rate_avg,
        entry_time: entry_time_avg,
        exit_time: exit_time_avg,
        profit: total_profit,
        profit_pips: total_pips,
        swap: total_swap,
        ..Default::default()
    };
}
