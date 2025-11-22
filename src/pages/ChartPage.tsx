import React from 'react'
import { useParams } from 'react-router-dom'
import ChartView from '../components/ChartView'

const ChartPage: React.FC = () => {
  const { timestamp } = useParams<{ timestamp: string }>()

  const selectedTradeTime = timestamp ? Number(timestamp) : null

  return (
    <div className="flex flex-col items-center">
      <ChartView selectedTradeTime={selectedTradeTime} />
    </div>
  )
}

export default ChartPage
