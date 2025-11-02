import { useState } from "react";
import CalendarPage from "./pages/CalendarPage";
import HistoryPage from "./pages/HistoryPage";
import ChartPage from "./pages/ChartPage";
import { Tab } from "./types";
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  return (
    <div className="flex h-screen font-sans">
      {/* サイドバー */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col h-full shadow-lg border-r border-gray-700">
        {/* タイトル */}
        <div className="text-2xl font-bold p-4 border-b border-gray-700">
          FX Manager
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-2 flex flex-col gap-2">
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === "calendar" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveTab("calendar")}
          >
            📅 カレンダー
          </button>
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === "history" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveTab("history")}
          >
            📊 取引履歴
          </button>
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === "chart" ? "bg-gray-700" : ""
            }`}
            onClick={() => setActiveTab("chart")}
          >
            📈 チャート
          </button>
        </nav>

        {/* フッター */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          © 2025 FX Manager
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">
        {activeTab === "calendar" && <CalendarPage />}
        {activeTab === "history" && <HistoryPage />}
        {activeTab === "chart" && <ChartPage />}
      </main>
    </div>
  );
}

export default App;
