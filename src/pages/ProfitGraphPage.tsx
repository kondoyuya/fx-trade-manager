import React from 'react'
import ProfitChart from '../components/DailyProfitChart.tsx'

const HistoryPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <ProfitChart />
    </div>
  )
}

export default HistoryPage
