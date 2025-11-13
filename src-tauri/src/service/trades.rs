use crate::db::queries::trades;
use crate::models::filter::trade_filter::TradeFilter;
use crate::models::service::trade_summary::TradeSummary;
use crate::DbState;

pub fn get_filtered_trades_summary(db: &DbState, filter: TradeFilter) -> Result<TradeSummary, String> { 
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
