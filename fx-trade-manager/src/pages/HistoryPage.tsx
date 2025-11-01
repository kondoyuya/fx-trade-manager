import React from "react";
import HistoryList from "../components/HistoryList.tsx";

const HistoryPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <HistoryList />
    </div>
  );
};

export default HistoryPage;