use crate::models::db::trade::Trade;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TradeSummary {
    pub trades: Vec<Trade>, // トレード一覧

    // 統計データ
    pub profit: i32,                  // 総利益
    pub profit_pips: i32,             // 総利益
    pub count: i32,                   // トレード回数
    pub wins: i32,                    // 勝ちトレード回数
    pub losses: i32,                  // 負けトレード回数
    pub win_total: i32,               // 勝ちトレード総額
    pub loss_total: i32,              // 負けトレード総額
    pub win_pips_total: i32,          // 勝ちトレード総額
    pub loss_pips_total: i32,         // 負けトレード総額
    pub avg_profit_wins: f64,         // 勝ちトレード平均額
    pub avg_profit_losses: f64,       // 負けトレード平均額
    pub avg_profit_pips_wins: f64,    // 勝ちトレード平均額
    pub avg_profit_pips_losses: f64,  // 負けトレード平均額
    pub avg_holding_time: f64,        // 平均保有時間
    pub avg_holding_time_wins: f64,   // 勝ちトレード平均保有時間
    pub avg_holding_time_losses: f64, // 勝ちトレード平均保有時間
}

impl TradeSummary {
    pub fn from_trades(trades: Vec<Trade>) -> Self {
        let count = trades.len() as i32;
        let mut profit = 0;
        let mut profit_pips = 0;
        let mut wins = 0;
        let mut losses = 0;
        let mut win_total = 0;
        let mut loss_total = 0;
        let mut win_pips_total = 0;
        let mut loss_pips_total = 0;
        let mut total_holding_time = 0f64;
        let mut total_holding_time_wins = 0f64;
        let mut total_holding_time_losses = 0f64;
        let mut profit_wins = 0f64;
        let mut profit_losses = 0f64;
        let mut profit_pips_wins = 0f64;
        let mut profit_pips_losses = 0f64;

        for t in &trades {
            profit += t.profit;
            profit_pips += t.profit_pips;

            let holding_time = (t.exit_time - t.entry_time) as f64;

            total_holding_time += holding_time;

            if t.profit > 0 {
                wins += 1;
                win_total += t.profit;
                win_pips_total += t.profit_pips;
                total_holding_time_wins += holding_time;
                profit_wins += t.profit as f64;
                profit_pips_wins += t.profit_pips as f64;
            } else if t.profit < 0 {
                losses += 1;
                loss_total += t.profit;
                loss_pips_total += t.profit_pips;
                total_holding_time_losses += holding_time;
                profit_losses += t.profit as f64;
                profit_pips_losses += t.profit_pips as f64;
            }
        }

        let avg_profit_wins = if wins > 0 {
            profit_wins / wins as f64
        } else {
            0.0
        };
        let avg_profit_losses = if losses > 0 {
            profit_losses / losses as f64
        } else {
            0.0
        };
        let avg_profit_pips_wins = if wins > 0 {
            profit_pips_wins / wins as f64
        } else {
            0.0
        };
        let avg_profit_pips_losses = if losses > 0 {
            profit_pips_losses / losses as f64
        } else {
            0.0
        };
        let avg_holding_time = if count > 0 {
            total_holding_time / count as f64
        } else {
            0.0
        };
        let avg_holding_time_wins = if wins > 0 {
            total_holding_time_wins / wins as f64
        } else {
            0.0
        };
        let avg_holding_time_losses = if losses > 0 {
            total_holding_time_losses / losses as f64
        } else {
            0.0
        };

        TradeSummary {
            trades,
            profit,
            profit_pips,
            count,
            wins,
            losses,
            win_total,
            loss_total,
            win_pips_total,
            loss_pips_total,
            avg_profit_wins: avg_profit_wins,
            avg_profit_losses: avg_profit_losses,
            avg_profit_pips_wins: avg_profit_pips_wins,
            avg_profit_pips_losses: avg_profit_pips_losses,
            avg_holding_time,
            avg_holding_time_wins,
            avg_holding_time_losses,
        }
    }
}
