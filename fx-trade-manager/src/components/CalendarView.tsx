import React, { useState, useEffect } from "react";
import Calendar, { CalendarProps } from "react-calendar";
import { invoke } from "@tauri-apps/api/core";
import { DailyProfit } from "../types";
import "react-calendar/dist/Calendar.css";
import ProfitEditor from "./ProfitEditor";

interface CalendarViewProps {}

const CalendarView: React.FC<CalendarViewProps> = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [profits, setProfits] = useState<DailyProfit>({});
  const [selectedProfit, setSelectedProfit] = useState<number | "">(0);
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  useEffect(() => {
    (async () => {
      const dbData = (await invoke("get_profits")) as { date: string; amount: number }[];
      const map: DailyProfit = {};
      dbData.forEach((e) => (map[e.date] = e.amount));
      setProfits(map);
    })();
  }, []);

  const handleDateChange: CalendarProps["onChange"] = (value) => {
    if (!value) return;
    const date = Array.isArray(value) ? value[0]! : value;
    setSelectedDate(date);
    const key = formatDate(date);
    setSelectedProfit(profits[key] ?? "");
    setIsEditing(true);
  };

  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const key = formatDate(date);
      const profit = profits[key];
      if (profit !== undefined) {
        const color = profit >= 0 ? "text-green-600" : "text-red-500";
        return (
          <p className={`text-xs mt-1 ${color}`}>
            {profit >= 0 ? "+" : ""}
            {profit}
          </p>
        );
      }
    }
    return null;
  };

  const handleSave = async () => {
    const key = formatDate(selectedDate);
    const value = Number(selectedProfit);
    await invoke("save_profit", { date: key, amount: value });
    setProfits({ ...profits, [key]: value });
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        locale="ja-JP"
        tileContent={renderTileContent}
      />

      {isEditing && (
        <ProfitEditor
          date={selectedDate}
          value={selectedProfit}
          setValue={setSelectedProfit}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

export default CalendarView;
