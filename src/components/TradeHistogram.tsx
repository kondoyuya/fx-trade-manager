import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Trade } from '../types'

type Props = {
  trades: Trade[]
  displayMode: '円' | 'pips'
  binSize: number
  capValue: number
}

export const TradeHistogram: React.FC<Props> = ({
  trades,
  displayMode,
  binSize,
  capValue,
}) => {
  const profits = useMemo(() => {
    return trades.map((t) =>
      displayMode === '円' ? (t.profit ?? 0) : (t.profit_pips ?? 0 / 10),
    )
  }, [trades, displayMode])

  const toBinInfo = (value: number) => {
    const cap = capValue * (displayMode === '円' ? 1 : 10)
    const bin = binSize * (displayMode === '円' ? 1 : 10)

    if (value <= -cap) return { label: `≤ -${capValue}`, start: -Infinity }
    if (value >= cap) return { label: `≥ +${capValue}`, start: Infinity }

    const start = Math.floor(value / bin) * bin
    const end = start + bin

    return {
      label: `${start / (displayMode === '円' ? 1 : 10)} ～ ${end / (displayMode === '円' ? 1 : 10)}`,
      start,
    }
  }

  const histData = useMemo(() => {
    const map: Record<string, { start: number; pos: number; neg: number }> = {}

    profits.forEach((v) => {
      const { label, start } = toBinInfo(v)
      if (!map[label]) map[label] = { start, pos: 0, neg: 0 }

      if (v >= 0) map[label].pos += 1
      else map[label].neg += 1
    })

    return Object.entries(map)
      .map(([label, obj]) => ({
        bin: label,
        start: obj.start,
        pos: obj.pos,
        neg: obj.neg,
        total: obj.pos + obj.neg,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => a.start - b.start)
  }, [profits, binSize, capValue])

  const unit = displayMode === '円' ? '円' : 'pips'

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer>
        <BarChart data={histData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="bin"
            interval={0}
            height={60}
            tick={{ fontSize: 11 }}
          />

          <YAxis />

          <Tooltip
            formatter={(v, name) => {
              if (name === 'pos' && v != "0") return [`${v} 回`, '頻度']
              else if (name === 'neg' && v != "0") return [`${v} 回`, '頻度']
              else return []
            }}
            labelFormatter={(l) => `${l} ${unit}`}
          />

          <Bar dataKey="pos" fill="#3b82f6" />
          <Bar dataKey="neg" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
