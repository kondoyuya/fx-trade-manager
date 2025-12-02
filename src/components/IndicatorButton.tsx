import React from 'react'
import { open } from '@tauri-apps/plugin-shell'

interface IndicatorButtonProps {
  date: Date
  buttonLabel?: string
}

export const IndicatorButton: React.FC<IndicatorButtonProps> = ({
  date,
  buttonLabel = '指標を確認',
}) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  const url = `https://fx.minkabu.jp/indicators?date=${yyyy}-${mm}-${dd}`

  return (
    <button
      onClick={() => open(url)}
      className="bg-gray-100 text-blue-500 border border-blue-600 px-3 py-1 rounded hover:bg-gray-200"
    >
      {buttonLabel}
    </button>
  )
}
