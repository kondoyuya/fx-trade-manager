import React from 'react'
import { DailySummary } from '../types'
import { formatHoldingTime } from '../utils/time'
import { formatProfit } from './format/Profit'

interface Props {
  summary: DailySummary['summary'] | null
  displayMode: '円' | 'pips'
}

export const TradeSummaryView: React.FC<Props> = ({ summary, displayMode }) => {
  if (!summary) {
    return <div>該当データがありません。</div>
  }

  const winRate =
    summary.count && summary.count > 0
      ? ((summary.wins / summary.count) * 100).toFixed(1)
      : 0

  return (
    <>
      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="総損益"
          color="green"
          value={formatProfit(displayMode, summary.profit, summary.profit_pips)}
        />
        <StatCard
          title="トレード回数"
          color="blue"
          value={summary.count ?? 0}
        />
        <StatCard
          title="勝ちトレード"
          color="emerald"
          value={summary.wins ?? 0}
        />
        <StatCard
          title="負けトレード"
          color="rose"
          value={summary.losses ?? 0}
        />
        <StatCard title="勝率" color="yellow" value={`${winRate}%`} />

        <StatCard
          title="総利益"
          color="teal"
          value={formatProfit(
            displayMode,
            summary.win_total,
            summary.win_pips_total,
          )}
        />
        <StatCard
          title="総損失"
          color="red"
          value={formatProfit(
            displayMode,
            summary.loss_total,
            summary.loss_pips_total,
          )}
        />
        <StatCard
          title="平均損益（勝ち）"
          color="cyan"
          value={formatProfit(
            displayMode,
            summary.avg_profit_wins,
            summary.avg_profit_pips_wins,
          )}
        />
        <StatCard
          title="平均損益（負け）"
          color="orange"
          value={formatProfit(
            displayMode,
            summary.avg_profit_losses,
            summary.avg_profit_pips_losses,
          )}
        />

        <StatCard
          title="平均保有時間"
          color="gray"
          value={formatHoldingTime(summary.avg_holding_time ?? 0)}
        />
        <StatCard
          title="平均保有時間（勝ち）"
          color="lime"
          value={formatHoldingTime(summary.avg_holding_time_wins ?? 0)}
        />
        <StatCard
          title="平均保有時間（負け）"
          color="fuchsia"
          value={formatHoldingTime(summary.avg_holding_time_losses ?? 0)}
        />
      </div>
    </>
  )
}

interface StatCardProps {
  title: string
  color: string
  value: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ title, color, value }) => (
  <div
    className={`p-4 rounded-2xl shadow-md bg-${color}-100 border border-${color}-200 flex flex-col`}
  >
    <span className="text-sm text-gray-600">{title}</span>
    <span className="text-xl font-bold mt-1">{value}</span>
  </div>
)
