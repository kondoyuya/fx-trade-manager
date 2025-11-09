import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { invoke } from "@tauri-apps/api/core";
import { DailySummary, Trade } from "../types";
import "react-calendar/dist/Calendar.css";
import { LabelSelectPopup } from "../components/LabelSelectButton";

const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const data = await invoke<DailySummary[]>("get_daily_records");
        setSummaries(data);
      } catch (err) {
        console.error("Failed to fetch summaries:", err);
      }
    }
    fetchSummary();
  }, []);

  const getSummaryFromDate = (date: Date): DailySummary | null => {
    const dateStr = date.toISOString().split("T")[0];
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
    return monthlySummaries.reduce((sum, s) => sum + (s.profit ?? 0), 0);
  };

  const tradesForDate = getSummaryFromDate(selectedDate)?.trades ?? [];

  return (
    <main className="container mx-auto p-4">
      <div className="flex space-x-4">
        {/* 左：カレンダー */}
        <div className="flex-shrink-0">
          <Calendar
            onClickDay={(value) => setSelectedDate(value)}
            tileContent={({ date }) => {
              const profit = getSummaryFromDate(date)?.profit ?? null;
              if (profit === null) return null;
              const color =
                profit > 0
                  ? "text-green-600"
                  : profit < 0
                  ? "text-red-600"
                  : "text-gray-400";
              return <p className={`text-xs ${color}`}>{profit.toFixed(0)}</p>;
            }}
          />
          <div className="mt-4 p-2 border rounded bg-gray-50">
            <h3 className="font-bold mb-1">
              {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月の収支
            </h3>
            <p className={`font-semibold ${getMonthlyProfit(selectedDate) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {getMonthlyProfit(selectedDate).toLocaleString("ja-JP", { maximumFractionDigits: 0 })} 円
            </p>
          </div>
        </div>

        {/* 右：日付詳細 + トレード一覧 */}
        <div className="flex-1 max-h-[600px] overflow-y-auto border rounded p-2">
          <h2 className="font-bold mb-2">{selectedDate.toLocaleDateString()} の詳細</h2>
          <p>利益: {getSummaryFromDate(selectedDate)?.profit ?? 0}</p>
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
                    <th className="px-2 py-1 border-b text-right">Entry</th>
                    <th className="px-2 py-1 border-b text-right">Exit</th>
                    <th className="px-2 py-1 border-b text-right">損益</th>
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
                      <td className="px-2 py-1 text-right">
                        {new Date(t.entry_time * 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {new Date(t.exit_time * 1000).toLocaleTimeString()}
                      </td>
                      <td
                        className={`px-2 py-1 text-right font-semibold ${
                          t.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.profit.toFixed(0)}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => handleLabelClick(t)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          ラベル登録
                        </button>
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
