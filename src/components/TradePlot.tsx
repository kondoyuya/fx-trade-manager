import React from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Trade } from '../types'
import { formatHoldingTime } from '../utils/time'

type Props = {
  trades: Trade[]
  displayMode: '円' | 'pips'
}

export const TradePlot: React.FC<Props> = ({ trades, displayMode }) => {
  const data = trades.map((t) => ({
    holding: t.exit_time - t.entry_time,
    profit: displayMode === '円' ? t.profit : t.profit_pips / 10,
  }))

  return (
    <div className="w-full h-full">
      <ResponsiveContainer>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="holding"
            name="保有時間"
            tickFormatter={(v) => formatHoldingTime(v)}
          />
          <YAxis type="number" dataKey="profit" name="損益" />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null

              const d = payload[0].payload
              const holdingSec = d.holding
              const profit = d.profit

              const mm = Math.floor(holdingSec / 60)
              const ss = holdingSec % 60
              const holdingStr = `${mm}分${ss.toString().padStart(2, '0')}秒`

              const unit = displayMode === '円' ? '円' : 'pips'
              const profitStr = `${profit} ${unit}`

              return (
                <div className="bg-white p-2 border rounded text-sm shadow">
                  <div>保有時間: {holdingStr}</div>
                  <div>損益: {profitStr}</div>
                </div>
              )
            }}
          />
          <Scatter data={data} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
