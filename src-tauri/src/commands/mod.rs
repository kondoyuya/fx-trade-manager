pub mod handlers;
pub mod records_cmd;
pub mod update_cmd;

macro_rules! register_commands {
    ($builder:expr) => {
        $builder.invoke_handler(tauri::generate_handler![
            crate::commands::update_cmd::check_for_updates,
            crate::commands::update_cmd::install_update,
            crate::commands::records_cmd::insert_record,
            crate::commands::records_cmd::insert_candle,
            crate::commands::records_cmd::get_all_records,
            crate::commands::records_cmd::get_all_trades,
            crate::commands::records_cmd::get_daily_records,
            crate::commands::records_cmd::get_candles,
            crate::commands::records_cmd::add_label,
            crate::commands::records_cmd::get_all_labels,
            crate::commands::records_cmd::get_all_labels_with_trade,
            crate::commands::records_cmd::add_trade_label,
            crate::commands::records_cmd::delete_trade_label,
            crate::commands::records_cmd::get_labels_for_trade,
            crate::commands::handlers::fetch_and_update_ohlc,
            crate::commands::handlers::fetch_and_update_tick,
            crate::commands::records_cmd::update_memo,
            crate::commands::records_cmd::get_filtered_trades_summary,
            crate::commands::records_cmd::merge_trades,
            crate::commands::records_cmd::get_ticks,
        ])
    };
}
pub(crate) use register_commands;
