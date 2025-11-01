use chrono::{NaiveDateTime, TimeZone, Utc};
use chrono_tz::Asia::Tokyo;

/// "YYYY/MM/DD hh:mm:ss"（JST）→ UNIX time（UTC基準
pub fn jst_str_to_unix(time_str: &str) -> Option<i64> {
    let naive = NaiveDateTime::parse_from_str(time_str, "%Y/%m/%d %H:%M:%S").ok()?;

    // JSTタイムゾーンとして扱い、UTCに変換
    let jst_dt = Tokyo.from_local_datetime(&naive).single()?;
    Some(jst_dt.with_timezone(&Utc).timestamp())
}
