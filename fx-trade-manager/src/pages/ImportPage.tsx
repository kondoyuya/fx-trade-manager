import React from "react";
import RecordUploader from "../components/RecordUploader.tsx";
import CandleUploader from "../components/CandleUploader.tsx";

const HistoryPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
        <RecordUploader />
        <CandleUploader />
    </div>
  );
};

export default HistoryPage;
