import { useEffect, useState } from "react";
import Calendar, { CalendarProps } from "react-calendar";
import { invoke } from "@tauri-apps/api/core";
import "react-calendar/dist/Calendar.css";
import "./index.css";

interface DailyProfit {
  [date: string]: number;
}

type Tab = "calendar" | "profits" | "settings";

function App() {
  const [selectedDate, setDate] = useState<Date>(new Date());
  const [profits, setProfits] = useState<DailyProfit>({});
  const [selectedProfit, setSelectedProfit] = useState<number | "">(0);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // 起動時にDBから読み込み
  useEffect(() => {
    (async () => {
      const dbData = (await invoke("get_profits")) as { date: string; amount: number }[];
      const map: DailyProfit = {};
      dbData.forEach((e) => (map[e.date] = e.amount));
      setProfits(map);
    })();
  }, []);

  const handleDateChange: CalendarProps['onChange'] = (value) => {
    if (!value) return;
    const date = Array.isArray(value) ? value[0] : value;
    if (date == null) return
    setDate(date);
    const key = formatDate(selectedDate);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        📊 FXトレードマネージャー
      </h1>

      <div className="flex h-screen">
      {/* 左サイドバー */}
      <div className="w-48 bg-gray-100 p-4 flex flex-col space-y-2">
        <button
          className={`p-2 rounded ${
            activeTab === "calendar" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("calendar")}
        >
          カレンダー
        </button>
        <button
          className={`p-2 rounded ${
            activeTab === "profits" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("profits")}
        >
          収支一覧
        </button>
        <button
          className={`p-2 rounded ${
            activeTab === "settings" ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          設定
        </button>
      </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-4">
        {activeTab === "calendar" && <div>
                <div className="bg-white p-4 rounded-2xl shadow-md">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          locale="ja-JP"
          tileContent={renderTileContent}
        />
      </div>

      {isEditing && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow-md w-80">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            {formatDate(selectedDate)} の収支を入力
          </h2>
          <input
            type="number"
            value={selectedProfit}
            onChange={(e) =>
              setSelectedProfit(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
            placeholder="例: 500 または -300"
          />
          <div className="flex justify-between">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      )}
          </div>}
        {activeTab === "profits" && <div>ここに収支一覧を表示</div>}
        {activeTab === "settings" && <div>ここに設定画面を表示</div>}
      </div>


    </div>
  );
}

export default App;
