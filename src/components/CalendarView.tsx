import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { invoke } from "@tauri-apps/api/core";
import { DailySummary, Trade } from "../types";
import "react-calendar/dist/Calendar.css";
import { LabelSelectPopup } from "../components/LabelSelectButton";
import { UpdateMemoButton } from "../components/UpdateMemoButton";

const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [displayMode, setDisplayMode] = useState<"円" | "pips">("円");

  useEffect(() => {
    async function fetchSummary() {
      try {
        const data = await invoke<DailySummary[]>("get_daily_records");
        setSummaries(data);
        console.log(data);
      } catch (err) {
        console.error("Failed to fetch summaries:", err);
      }
    }
    fetchSummary();
  }, []);

  const getSummaryFromDate = (date: Date): DailySummary | null => {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}-${String(jst.getDate()).padStart(2, "0")}`;
    return summaries.find((s) => s.date === dateStr) ?? null;
  };

  const handleLabelClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowPopup(true);
  };

  const formatHoldingTime = (seconds: number): string => {
    const rounded = Math.round(seconds); // 小数点四捨五入
    const min = Math.floor(rounded / 60);
    const sec = rounded % 60;
    return `${min}分${sec}秒`;
  };

  // 月間利益を計算
  const getMonthlyProfit = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const monthlySummaries = summaries.filter((s) => {
      const sDate = new Date(s.date);
      return sDate.getFullYear() === year && sDate.getMonth() === month;
    });
    return displayMode === "円"
    ? monthlySummaries.reduce((sum, s) => sum + (s.profit ?? 0), 0)
    : monthlySummaries.reduce((sum, s) => sum + (s.profit_pips ?? 0), 0) / 10;
  };

  const tradesForDate = getSummaryFromDate(selectedDate)?.trades ?? [];

  return (
    <main className="container mx-auto p-4">
      <div className="flex space-x-2 mb-2">
        <button
          onClick={() => setDisplayMode("円")}
          className={`px-2 py-1 rounded ${
            displayMode === "円" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          円
        </button>
        <button
          onClick={() => setDisplayMode("pips")}
          className={`px-2 py-1 rounded ${
            displayMode === "pips" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          pips
        </button>
      </div>
      <div className="flex space-x-4">
        {/* 左：カレンダー */}
        <div className="flex-shrink-0">
          <Calendar
            onClickDay={(value) => setSelectedDate(value)}
            tileContent={({ date }) => {
              const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
              const dateStr = `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, "0")}-${String(jst.getDate()).padStart(2, "0")}`;
              const summary = summaries.find(s => s.date === dateStr);
              if (!summary) return null;

              const profit = displayMode === "円" ? summary.profit : summary.profit_pips / 10;
              const color = profit > 0 ? "text-blue-600" : profit < 0 ? "text-red-600" : "text-gray-400";

              return (
                <p className={`text-xs ${profit !== 0 ? "font-bold" : ""} ${color}`}>
                  {(profit > 0 ? "+" : "") + profit.toFixed(displayMode === "円" ? 0 : 1)}
                </p>
              );
            }}
          />
          <div className="mt-4 p-2 border rounded bg-gray-50">
            <h3 className="font-bold mb-1">
              {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月の収支
            </h3>
            <p className={`font-semibold ${getMonthlyProfit(selectedDate) >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {(getMonthlyProfit(selectedDate) > 0 ? "+" : "") 
              + getMonthlyProfit(selectedDate) + displayMode} 
            </p>
          </div>
        </div>

        {/* 右：日付詳細 + トレード一覧 */}
        <div className="flex-1 max-h-[600px] overflow-y-auto border rounded p-2">
          <h2 className="font-bold mb-2">{selectedDate.toLocaleDateString()} の詳細</h2>
          <p>  利益:{" "}
            {displayMode === "円"
              ? getSummaryFromDate(selectedDate)?.profit ?? 0
              : (getSummaryFromDate(selectedDate)?.profit_pips ?? 0) / 10
            } {displayMode}</p>
          <p>トレード回数: {getSummaryFromDate(selectedDate)?.count ?? 0}</p>
          <p>勝ちトレード回数: {getSummaryFromDate(selectedDate)?.wins ?? 0}</p>
          <p>負けトレード回数: {getSummaryFromDate(selectedDate)?.losses ?? 0}</p>
          <p>
            平均保有時間:{" "}
            {formatHoldingTime(
              (getSummaryFromDate(selectedDate)?.total_holding_time ?? 0) /
                (getSummaryFromDate(selectedDate)?.count ?? 1)
            )}
          </p>
          <p>
            勝率:{" "}
            {getSummaryFromDate(selectedDate)?.count ?? 0 > 0
              ? (
                  ((getSummaryFromDate(selectedDate)?.wins ?? 0) /
                    (getSummaryFromDate(selectedDate)?.count ?? 1)) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>

          {/* トレード一覧テーブル */}
          {tradesForDate.length ? (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm table-auto border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 border-b text-center">#</th>
                    <th className="px-2 py-1 border-b text-center">通貨ペア</th>
                    <th className="px-2 py-1 border-b text-center">売買</th>
                    <th className="px-2 py-1 border-b text-right">Lot</th>
                    <th className="px-2 py-1 border-b text-right">Entry Rate</th>
                    <th className="px-2 py-1 border-b text-right">Exit Rate</th>
                    <th className="px-2 py-1 border-b text-right">Entry Time</th>
                    <th className="px-2 py-1 border-b text-right">Exit Time</th>
                    <th className="px-2 py-1 border-b text-right">損益</th>
                    <th className="px-2 py-1 border-b text-center">操作</th>
                    <th className="px-2 py-1 border-b text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tradesForDate.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-1 text-center">{t.id}</td>
                      <td className="px-2 py-1 text-center">{t.pair}</td>
                      <td
                        className={`px-2 py-1 text-center font-semibold ${
                          t.side === "買" ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {t.side}
                      </td>
                      <td className="px-2 py-1 text-right">{t.lot}</td>
                      <td className="px-2 py-1 text-right">{t.entry_rate}</td>
                      <td className="px-2 py-1 text-right">{t.exit_rate}</td>
                      <td className="px-2 py-1 text-right">
                        {new Date(t.entry_time * 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {new Date(t.exit_time * 1000).toLocaleTimeString()}
                      </td>
                      <td
                        className={`px-2 py-1 text-right font-semibold ${
                          t.profit >= 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {(t.profit > 0 ? "+" : "") +
                        (displayMode == "円" 
                          ? t.profit.toFixed(0)
                          : (t.profit / t.lot / 100).toFixed(1))
                        }
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => handleLabelClick(t)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          ラベル登録
                        </button>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <UpdateMemoButton tradeId={t.id} memoContent={t.memo} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-gray-500">トレードはありません。</p>
          )}
        </div>
      </div>

      {/* ラベル登録ポップアップ */}
      {showPopup && selectedTrade && (
        <LabelSelectPopup
          trade={selectedTrade}
          onClose={() => setShowPopup(false)}
        />
      )}
    </main>
  );
};

export default CalendarView;
