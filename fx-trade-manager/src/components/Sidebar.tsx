import React from "react";
import { Tab } from "../types";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { label: string; key: Tab }[] = [
    { label: "カレンダー", key: "calendar" },
    { label: "収支一覧", key: "profits" },
    { label: "設定", key: "settings" },
  ];

  return (
    <div className="w-48 bg-gray-100 p-4 flex flex-col space-y-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`p-2 rounded ${
            activeTab === tab.key ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
