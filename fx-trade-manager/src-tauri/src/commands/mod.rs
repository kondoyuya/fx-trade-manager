pub mod records_cmd;

macro_rules! register_commands {
    ($builder:expr) => {
        $builder.invoke_handler(tauri::generate_handler![
            crate::commands::records_cmd::insert_record,
            crate::commands::records_cmd::insert_candle,
            crate::commands::records_cmd::get_all_records,
            crate::commands::records_cmd::get_daily_records,
        ])
    };
}
pub(crate) use register_commands;
