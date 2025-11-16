import React from 'react'
import { DisplayMode } from '../DisplayModeToggle'

type ProfitProps = {
  profit: number
  className?: string
  toFix?: number
  displayMode?: DisplayMode
}

export const Profit: React.FC<ProfitProps> = ({
  profit,
  className = 'px-2 py-1 text-right font-semibold',
  toFix = 0,
  displayMode = '',
}) => {
  const colorClass = profit >= 0 ? 'text-blue-600' : 'text-red-600'
  const sign = profit > 0 ? '+' : ''

  const formatted = new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: toFix,
    maximumFractionDigits: toFix,
  }).format(profit)

  return (
    <span className={`${colorClass} ${className}`}>
      {sign + formatted + displayMode}
    </span>
  )
}

export const formatProfit = (
  displayMode: DisplayMode,
  yen: number | null,
  pips: number | null,
  withUnit: boolean = true,
) => {
  const value = displayMode === '円' ? (yen ?? 0) : (pips ?? 0) / 10

  if (withUnit) {
    return (
      <Profit
        profit={value}
        toFix={displayMode === '円' ? 0 : 1}
        displayMode={displayMode}
      />
    )
  } else {
    return <Profit profit={value} toFix={displayMode === '円' ? 0 : 1} />
  }
}
