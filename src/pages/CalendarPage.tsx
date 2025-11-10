import React from "react";
import CalendarView from "../components/CalendarView";

const CalendarPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <CalendarView />
    </div>
  );
};

export default CalendarPage;
