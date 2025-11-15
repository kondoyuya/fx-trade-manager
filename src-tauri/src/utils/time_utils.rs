use chrono::Datelike;
use chrono::NaiveDate;
use chrono::{NaiveDateTime, TimeZone, Utc};
use chrono_tz::Asia::Tokyo;

/// "YYYY/MM/DD hh:mm:ss"（JST）→ UNIX time（UTC基準
pub fn jst_str_to_unix(time_str: &str) -> Option<i64> {
    let naive = NaiveDateTime::parse_from_str(time_str, "%Y/%m/%d %H:%M:%S").ok()?;

    // JSTタイムゾーンとして扱い、UTCに変換
    let jst_dt = Tokyo.from_local_datetime(&naive).single()?;
    Some(jst_dt.with_timezone(&Utc).timestamp())
}

/// JSTのUNIX時刻から「取引日（夏時間は翌6時、冬時間は翌7時で区切り）」を算出
pub fn get_business_date_from_unix(unix: i64) -> chrono::NaiveDate {
    let jst = chrono_tz::Asia::Tokyo;
    let ny = chrono_tz::America::New_York;

    // UNIX秒 (JST基準) → JST日時
    let naive = chrono::NaiveDateTime::from_timestamp_opt(unix + 3600 * 7, 0) // NY時間で0時が境界になるように調整
        .unwrap_or_else(|| chrono::NaiveDateTime::from_timestamp(0, 0));
    let jst_dt = jst.from_utc_datetime(&naive);

    // JST → UTC → NY時間 に変換
    let ny_dt = jst_dt.with_timezone(&ny);

    // NYでの日付を基準にすれば、DSTに応じて自動で6時/7時切り替わる
    let business_date = ny_dt.date_naive();

    business_date
}

/// 取引日 (YYYYMMDD) から JSTの開始・終了UNIX時刻を取得
/// 夏時間は翌6時、冬時間は翌7時を区切りとする
/// 例：20251110 → JSTの 2025-11-10 07:00:00 ～ 2025-11-11 06:59:59
pub fn get_unix_range_from_business_date(date_str: &str) -> Option<(i64, i64)> {
    let jst = chrono_tz::Asia::Tokyo;
    let ny = chrono_tz::America::New_York;
    let date = NaiveDate::parse_from_str(date_str, "%Y%m%d").ok()?;

    // NY時間で当日17:00（＝JST翌朝6時 or 7時）
    let end_ny = ny
        .with_ymd_and_hms(date.year(), date.month(), date.day(), 17, 0, 0)
        .single()?;
    let end_jst = end_ny.with_timezone(&jst);

    let end_jst_timestamp = end_jst.timestamp();
    let start_jst_timestamp = end_jst_timestamp - (60 * 60 * 24);

    Some((start_jst_timestamp, end_jst_timestamp))
}
