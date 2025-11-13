import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TradeSummary } from "../types";
import { formatHoldingTime } from "../utils/time";
import { Profit } from "../components/format/Profit";
import { DisplayModeToggle, DisplayMode } from "../components/DisplayModeToggle";

export const TradeList: React.FC = () => {
  const [startDate, setStartDate] = useState("2025-11-01");
  const [endDate, setEndDate] = useState("2025-11-13");
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("円");

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const result = await invoke<TradeSummary>("get_filtered_trades_summary", {
        filter: { start_date: startDate, end_date: endDate },
      });
      setSummary(result);
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

  const formatProfit = (yen?: number | null, pips?: number | null, toFix?: number) => {
    if (displayMode === "円") {
      return <Profit profit={yen ?? 0} toFix={toFix} />;
    } else {
      return <Profit profit={(pips ?? 0) / 10} toFix={toFix ?? 1} />;
    }
  };

  const winRate =
    summary && summary.count > 0
      ? ((summary.wins / summary.count) * 100).toFixed(1)
      : "0.0";

  if (loading) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="p-6 font-sans">
      <h2 className="text-2xl font-semibold mb-4">トレード統計</h2>

      {/* 円/pips切り替え */}
      <div className="mb-4">
        <DisplayModeToggle value={displayMode} onChange={setDisplayMode} />
      </div>

      {/* 日付フィルター */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <label className="flex items-center gap-2">
          開始日:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </label>
        <label className="flex items-center gap-2">
          終了日:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </label>
        <button
          onClick={fetchTrades}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          更新
        </button>
      </div>

      {/* 統計カード */}
      {summary ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="総損益" color="green" value={formatProfit(summary.profit, summary.profit_pips)} />
            <StatCard title="トレード回数" color="blue" value={summary.count ?? 0} />
            <StatCard title="勝ちトレード" color="emerald" value={summary.wins ?? 0} />
            <StatCard title="負けトレード" color="rose" value={summary.losses ?? 0} />
            <StatCard title="勝率" color="yellow" value={`${winRate}%`} />

            <StatCard title="総利益" color="teal" value={formatProfit(summary.win_total, summary.win_pips_total)} />
            <StatCard title="総損失" color="red" value={formatProfit(summary.loss_total, summary.loss_pips_total)} />
            <StatCard title="平均損益（勝ち）" color="cyan" value={formatProfit(summary.avg_profit_wins, summary.avg_profit_pips_wins)} />
            <StatCard title="平均損益（負け）" color="orange" value={formatProfit(summary.avg_profit_losses, summary.avg_profit_pips_losses)} />

            <StatCard title="平均保有時間" color="gray" value={formatHoldingTime(summary.avg_holding_time ?? 0)} />
            <StatCard title="平均保有時間（勝ち）" color="lime" value={formatHoldingTime(summary.avg_holding_time_wins ?? 0)} />
            <StatCard title="平均保有時間（負け）" color="fuchsia" value={formatHoldingTime(summary.avg_holding_time_losses ?? 0)} />
          </div>

          {/* トレード一覧 */}
          {summary.trades.length > 0 ? (
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "center",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f0f0f0",
                    zIndex: 1,
                  }}
                >
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
                        {t.entry_time
                          ? new Date(t.entry_time * 1000).toLocaleString()
                          : "-"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          textAlign: "right",
                        }}
                      >
                        {formatProfit(t.profit, t.profit_pips)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>該当データがありません。</div>
          )}
        </>
      ) : (
        <div>該当データがありません。</div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  color: string;
  value: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, color, value }) => (
  <div
    className={`p-4 rounded-2xl shadow-md bg-${color}-100 border border-${color}-200 flex flex-col`}
  >
    <span className="text-sm text-gray-600">{title}</span>
    <span className="text-xl font-bold mt-1">{value}</span>
  </div>
);

export default TradeList;
