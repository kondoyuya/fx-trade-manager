import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DailySummary } from "../types";
import { invoke } from "@tauri-apps/api/core";

function computeCumulativeProfit(
  summaries: DailySummary[],
  displayMode: "円" | "pips" = "円",
  startDate?: string, // "yyyy-mm-dd"
  endDate?: string    // "yyyy-mm-dd"
) {
  // 期間でフィルタ
  let filtered = summaries;
  if (startDate) {
    filtered = filtered.filter(s => s.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(s => s.date <= endDate);
  }

  // 日付順にソート
  const sorted = [...filtered].sort((a, b) => (a.date > b.date ? 1 : -1));

  let cumulative = 0;
  const result = sorted.map(s => {
    const profit = displayMode === "円" ? s.profit : s.profit_pips / 10;
    cumulative += profit;
    return {
      date: s.date,
      cumulativeProfit: cumulative,
    };
  });

  return result;
}

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // 0始まりなので +1
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const ProfitChart: React.FC = () => {
  const [startDate, setStartDate] = useState("2000-01-01");
  const [endDate, setEndDate] = useState(getTodayString());
  const [data, setData] = useState<{date: string, cumulativeProfit: number}[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [displayMode, setDisplayMode] = useState<"円" | "pips">("円");

  useEffect(() => {
    async function fetchSummary() {
      try {
        const summaries = await invoke<DailySummary[]>("get_daily_records");
        setSummaries(summaries);
        setData(computeCumulativeProfit(summaries, displayMode, startDate, endDate));
      } catch (err) {
        console.error("Failed to fetch summaries:", err);
      }
    }
    fetchSummary();
  }, []);

  useEffect(() => {
    async function changeDisplayMode() {
      try {
        setData(computeCumulativeProfit(summaries, displayMode, startDate, endDate));
      } catch (err) {
        console.error("Failed to fetch summaries:", err);
      }
    }
    changeDisplayMode();
  }, [displayMode, startDate, endDate]);

  return (
    <div className="p-4">
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
      <div className="flex gap-2 mb-4">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <ResponsiveContainer width={1000} height={700}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            tick={{ fontSize: 14 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US').format(value)
            }
          />
          <Tooltip />
          <Line type="monotone" dataKey="cumulativeProfit" stroke="#82ca9d" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitChart;
