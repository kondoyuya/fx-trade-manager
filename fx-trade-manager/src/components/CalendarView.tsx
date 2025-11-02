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

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Daily Profit Calendar</h1>

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
            {getProfitForDate(selectedDate)?.toLocaleString("ja-JP", {
              maximumFractionDigits: 0,
            }) ?? "-"}
          </p>
        </div>
      )}
    </main>
  );
};

export default CalendarView;
