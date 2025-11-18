import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Trade } from '../types'

interface Props {
  trades: Trade[]
  displayMode: '円' | 'pips'
}

export const TradeProfitChart: React.FC<Props> = ({ trades, displayMode }) => {
  // ▼ 累積損益を計算したグラフ用データに整形する
  const chartData = useMemo(() => {
    let cumulative = 0
    let cnt = 0

    // 日付昇順にソート
    const sorted = [...trades].sort(
      (a, b) =>
        new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime(),
    )

    return sorted.map((t) => {
      const value = displayMode === '円' ? t.profit : t.profit_pips / 10
      cumulative += value
      cnt += 1

      return {
        date: cnt,
        value: cumulative,
      }
    })
  }, [trades, displayMode])

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 40, left: 70, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            tick={{ fontSize: 14 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US').format(value)
            }
          />
          <Tooltip
            formatter={(v) => new Intl.NumberFormat('en-US').format(Number(v))}
            labelFormatter={(label) => `${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4f9cff"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TradeProfitChart
