import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailySummary } from '../types'
import { invoke } from '@tauri-apps/api/core'
import { DisplayModeToggle, DisplayMode } from '../components/DisplayModeToggle'
import { getTodayString, getStartOfYearString } from '../utils/time'

function computeCumulativeProfit(
  summaries: DailySummary[],
  displayMode: DisplayMode = '円',
  startDate?: string, // "yyyy-mm-dd"
  endDate?: string, // "yyyy-mm-dd"
) {
  let filtered = summaries
  if (startDate) filtered = filtered.filter((s) => s.date >= startDate)
  if (endDate) filtered = filtered.filter((s) => s.date <= endDate)

  const sorted = [...filtered].sort((a, b) => (a.date > b.date ? 1 : -1))

  let cumulative = 0
  return sorted.map((s) => {
    const profit =
      displayMode === '円' ? s.summary.profit : s.summary.profit_pips / 10
    cumulative += profit
    return {
      date: s.date,
      cumulativeProfit: cumulative,
    }
  })
}

export const ProfitChart: React.FC = () => {
  const [startDate, setStartDate] = useState(getStartOfYearString())
  const [endDate, setEndDate] = useState(getTodayString())
  const [data, setData] = useState<
    { date: string; cumulativeProfit: number }[]
  >([])
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [displayMode, setDisplayMode] = useState<DisplayMode>('円')

  useEffect(() => {
    async function fetchSummary() {
      try {
        const summaries = await invoke<DailySummary[]>('get_daily_records')
        setSummaries(summaries)
        setData(
          computeCumulativeProfit(summaries, displayMode, startDate, endDate),
        )
      } catch (err) {
        console.error('Failed to fetch summaries:', err)
      }
    }
    fetchSummary()
  }, [])

  useEffect(() => {
    setData(computeCumulativeProfit(summaries, displayMode, startDate, endDate))
  }, [displayMode, startDate, endDate])

  return (
    <div className="p-4">
      <DisplayModeToggle value={displayMode} onChange={setDisplayMode} />

      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <ResponsiveContainer width={1000} height={700}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            tick={{ fontSize: 14 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US').format(value)
            }
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="cumulativeProfit"
            stroke="#82ca9d"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ProfitChart
