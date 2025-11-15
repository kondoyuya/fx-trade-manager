use crate::db::queries::{trade_label, trades};
use crate::db::DbState;
use crate::models::db::label::Label;
use crate::models::service::label_summary::LabelSummary;

pub fn insert_label(db: &DbState, name: &str) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();

    conn.execute("INSERT INTO labels (name) VALUES (?)", [&name])
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn insert_trade_label(db: &DbState, trade_id: i32, label_id: i32) -> Result<(), String> {
    trade_label::insert_trade_label(db, trade_id, label_id)
}

pub fn delete_trade_label(db: &DbState, trade_id: i32, label_id: i32) -> Result<(), String> {
    trade_label::delete_trade_label(db, trade_id, label_id)
}

pub fn get_labels_for_trade(db: &DbState, trade_id: i32) -> Result<Vec<i32>, String> {
    trade_label::find_by_trade_id(db, trade_id)
}

pub fn fetch_all_labels(state: &DbState) -> Result<Vec<Label>, String> {
    let state = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = state
        .prepare("SELECT * FROM labels")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Label {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut labels = Vec::new();
    for r in rows {
        labels.push(r.map_err(|e| e.to_string())?);
    }
    Ok(labels)
}

pub fn fetch_all_label_with_trade(state: &DbState) -> Result<Vec<LabelSummary>, String> {
    let label_rows: Vec<(i32, String)> = {
        let db = state.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = db
            .prepare("SELECT id, name FROM labels")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for r in rows {
            result.push(r.map_err(|e| e.to_string())?);
        }
        result
    };

    let mut label_with_trades = Vec::new();
    for (id, name) in label_rows {
        let trades = trades::get_trades_by_label(state, id)?;
        let mut summary = LabelSummary {
            id: id,
            name: name,
            trades: trades.clone(),
            ..Default::default()
        };
        for t in trades {
            summary.profit += t.profit;
            summary.profit_pips += t.profit_pips;
            summary.count += 1;
            summary.total_holding_time += t.exit_time - t.entry_time;

            if t.profit > 0 {
                summary.wins += 1;
                summary.win_total += t.profit;
            } else if t.profit < 0 {
                summary.losses += 1;
                summary.loss_total += t.profit;
            }
        }

        label_with_trades.push(summary);
    }

    Ok(label_with_trades)
}
