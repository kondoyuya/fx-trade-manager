import { useState } from "react";
import { Tab } from "./types";
import Sidebar from "./components/Sidebar";
import CalendarPage from "./pages/CalendarPage";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 FXトレードマネージャー</h1>
      <div className="flex h-screen w-full">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 p-4">
          {activeTab === "calendar" && <CalendarPage />}
          {activeTab === "profits" && <div>ここに収支一覧を表示</div>}
          {activeTab === "settings" && <div>ここに設定画面を表示</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
