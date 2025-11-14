import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TradeSummary } from "../types";
import { formatHoldingTime, getStartOfMonthString, getTodayString, parseTimeToSeconds } from "../utils/time";
import { formatProfit } from './format/Profit';
import { DisplayModeToggle, DisplayMode } from "../components/DisplayModeToggle";
import { TradeTable } from "../components/TradeTable";
import { TradeFilter, TradeFilterValues } from "../components/TradeFilter";

export const TradeList: React.FC = () => {
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("円");
  const [filterValues, setFilterValues] = useState<TradeFilterValues>({
    startDate: getStartOfMonthString(),
    endDate: getTodayString(),
    minHoldingEnabled: false,
    minHoldingTime: "00:00:00",
    maxHoldingEnabled: false,
    maxHoldingTime: "00:00:00",
  });

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const filter: any = {
        start_date: filterValues.startDate,
        end_date: filterValues.endDate,
      };
      if (filterValues.minHoldingEnabled)
        filter.min_holding_time = parseTimeToSeconds(filterValues.minHoldingTime);
      if (filterValues.maxHoldingEnabled)
        filter.max_holding_time = parseTimeToSeconds(filterValues.maxHoldingTime);

      const result = await invoke<TradeSummary>("get_filtered_trades_summary", { filter });
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
  }, []);

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

      {/* フィルター */}
      <TradeFilter
        values={filterValues}
        onChange={setFilterValues}
        onApply={fetchTrades}
      />

      {/* 統計カード */}
      {summary ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="総損益" color="green" value={formatProfit(displayMode, summary.profit, summary.profit_pips)} />
            <StatCard title="トレード回数" color="blue" value={summary.count ?? 0} />
            <StatCard title="勝ちトレード" color="emerald" value={summary.wins ?? 0} />
            <StatCard title="負けトレード" color="rose" value={summary.losses ?? 0} />
            <StatCard title="勝率" color="yellow" value={`${winRate}%`} />

            <StatCard title="総利益" color="teal" value={formatProfit(displayMode, summary.win_total, summary.win_pips_total)} />
            <StatCard title="総損失" color="red" value={formatProfit(displayMode, summary.loss_total, summary.loss_pips_total)} />
            <StatCard title="平均損益（勝ち）" color="cyan" value={formatProfit(displayMode, summary.avg_profit_wins, summary.avg_profit_pips_wins)} />
            <StatCard title="平均損益（負け）" color="orange" value={formatProfit(displayMode, summary.avg_profit_losses, summary.avg_profit_pips_losses)} />

            <StatCard title="平均保有時間" color="gray" value={formatHoldingTime(summary.avg_holding_time ?? 0)} />
            <StatCard title="平均保有時間（勝ち）" color="lime" value={formatHoldingTime(summary.avg_holding_time_wins ?? 0)} />
            <StatCard title="平均保有時間（負け）" color="fuchsia" value={formatHoldingTime(summary.avg_holding_time_losses ?? 0)} />
          </div>

          {/* トレード一覧 */}
          <TradeTable
            trades={summary.trades}
            displayMode={displayMode}
            onLabelClick={() => {}}
            renderMemoButton={() => null}
          />
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
