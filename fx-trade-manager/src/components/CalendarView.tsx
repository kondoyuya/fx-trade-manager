import React, { useState, useEffect } from "react";
import Calendar, { CalendarProps } from "react-calendar";
import { invoke } from "@tauri-apps/api/core";
import { DailySummary } from "../types";
import "react-calendar/dist/Calendar.css";

interface CalendarViewProps {}

const CalendarView: React.FC<CalendarViewProps> = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const summaries = await invoke<DailySummary[]>("get_daily_records");
        console.log("📅 Daily summaries:", summaries);
        setSummaries(summaries);
      } catch (err) {
        console.error("❌ Failed to fetch summaries:", err);
      }
    }
    fetchSummary();
  }, []);

  const getProfitForDate = (date: Date): number | null => {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const record = summaries.find((s) => s.date === dateStr);
    return record ? record.profit : null;
  };

  const getSummaryFromDate = (date: Date): DailySummary | null => {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const record = summaries.find((s) => s.date === dateStr);
    return record ? record : null;
  };

  return (
    <main className="container mx-auto p-4">

      <Calendar
        onClickDay={(value) => setSelectedDate(value)}
        tileContent={({ date }) => {
          const profit = getProfitForDate(date);
          if (profit === null) return null;

          const color =
            profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-gray-400";
          return <p className={`text-xs ${color}`}>{profit.toFixed(0)}</p>;
        }}
      />

      {selectedDate && (
        <div className="mt-4">
          <h2 className="font-bold">
            {selectedDate.toLocaleDateString()} の詳細
          </h2>
          <p>
            利益:{" "}
            {getSummaryFromDate(selectedDate)?.profit.toLocaleString("ja-JP", {
              maximumFractionDigits: 0,
            }) ?? "0"}
          </p>
          <p>
            トレード回数:{" "}
            {getSummaryFromDate(selectedDate)?.count ?? "0"}
          </p>
          <p>
            勝ちトレード回数:{" "}
            {getSummaryFromDate(selectedDate)?.wins ?? "0"}
          </p>
          <p>
            負けトレード回数:{" "}
            {getSummaryFromDate(selectedDate)?.losses ?? "0"}
          </p>
          <p>
            勝率:{" "}
            {getSummaryFromDate(selectedDate)?.count ?? 0 > 0
              ? (((getSummaryFromDate(selectedDate)?.wins ?? 0) / (getSummaryFromDate(selectedDate)?.count ?? 1)) * 100).toFixed(1)
              : 0}
            %
          </p>
          
        </div>
      )}
    </main>
  );
};

export default CalendarView;
