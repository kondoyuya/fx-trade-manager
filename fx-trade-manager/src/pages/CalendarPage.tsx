import React from "react";
import CalendarView from "../components/CalendarView";
import CsvUploader from "../components/CsvUploader";

const CalendarPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <CsvUploader />
      <CalendarView />
    </div>
  );
};

export default CalendarPage;
