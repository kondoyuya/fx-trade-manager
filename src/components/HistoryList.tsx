import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TradeSummary } from "../types";
import { formatHoldingTime } from '../utils/time';
import { Profit } from "../components/format/Profit"; // Profit コンポーネントをインポート

export const TradeList: React.FC = () => {
  const [startDate, setStartDate] = useState("2025-11-01");
  const [endDate, setEndDate] = useState("2025-11-13");
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const result = await invoke<TradeSummary>("get_filtered_trades_summary", {
        filter: { 
          start_date: startDate,
          end_date: endDate 
        },
      });
      setSummary(result);
      console.log(result);
    } catch (err) {
      console.error(err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [startDate, endDate]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>トレード履歴</h2>

      {/* 日付フィルター */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <label>
          開始日：
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>
        <label>
          終了日：
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>
        <button onClick={fetchTrades} style={{ padding: "5px 10px", cursor: "pointer" }}>
          更新
        </button>
      </div>

      {/* 統計データ */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>総利益:</strong> <Profit profit={summary.profit ?? 0} />
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>総pips:</strong>  <Profit profit={(summary.profit_pips ?? 0) /10} toFix={1} />
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>トレード回数:</strong> {summary.count ?? 0}
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>勝ちトレード:</strong> {summary.wins ?? 0} ({(summary.win_total ?? 0).toFixed(2)})
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>負けトレード:</strong> {summary.losses ?? 0} ({(summary.loss_total ?? 0).toFixed(2)})
          </div>

          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均利益（勝ち）:</strong> <Profit profit={summary.avg_profit_wins ?? 0} />
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均利益（負け）:</strong> <Profit profit={summary.avg_profit_losses ?? 0} />
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均pips（勝ち）:</strong> {(summary.avg_profit_pips_wins ?? 0).toFixed(2)}
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均pips（負け）:</strong> {(summary.avg_profit_pips_losses ?? 0).toFixed(2)}
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均保有時間:</strong> {formatHoldingTime(summary.avg_holding_time ?? 0)}
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均保有時間（勝ち）:</strong> {formatHoldingTime(summary.avg_holding_time_wins ?? 0)}
          </div>
          <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
            <strong>平均保有時間（負け）:</strong> {formatHoldingTime(summary.avg_holding_time_losses ?? 0)}
          </div>
        </div>
      )}

      {/* ローディング */}
      {loading && <div>読み込み中...</div>}

      {/* トレード一覧（スクロール可能） */}
      {summary && summary.trades.length > 0 ? (
        <div
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f0f0f0", zIndex: 1 }}>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>通貨ペア</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>日時</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>損益</th>
              </tr>
            </thead>
            <tbody>
              {summary.trades.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{t.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{t.pair ?? "-"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {t.entry_time ? new Date(t.entry_time * 1000).toLocaleString() : "-"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>
                    <Profit profit={t.profit ?? 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div>該当するトレードはありません。</div>
      )}
    </div>
  );
};

export default TradeList;
