import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trade } from '../types'
import { formatProfit } from './format/Profit'
import { invoke } from '@tauri-apps/api/core'

type TradeTableProps = {
  trades: Trade[]
  displayMode: '円' | 'pips'
  onLabelClick: (trade: Trade) => void
  renderMemoButton: (
    tradeId: number,
    memoContent: string | null,
  ) => React.ReactNode
  onMerged?: () => Promise<void>
}

export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  displayMode,
  onLabelClick,
  renderMemoButton,
  onMerged,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleMerge = async () => {
    if (selectedIds.size < 2) {
      alert('マージには2件以上選択してください')
      return
    }

    try {
      await invoke('merge_trades', { ids: Array.from(selectedIds) })
      if (onMerged) {
        onMerged()
      }
      alert('マージ完了')
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      alert(e)
    }
  }

  if (!trades.length) {
    return <p className="mt-2 text-gray-500">トレードはありません。</p>
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <button
        onClick={handleMerge}
        className="mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        選択トレードをマージ
      </button>
      <table className="min-w-full text-sm table-auto border-collapse">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th className="px-2 py-1 border-b text-center">選択</th>
            <th className="px-2 py-1 border-b text-center">#</th>
            <th className="px-2 py-1 border-b text-center">通貨ペア</th>
            <th className="px-2 py-1 border-b text-center">売買</th>
            <th className="px-2 py-1 border-b text-right">Lot</th>
            <th className="px-2 py-1 border-b text-right">Entry Rate</th>
            <th className="px-2 py-1 border-b text-right">Exit Rate</th>
            <th className="px-2 py-1 border-b text-right">Entry Time</th>
            <th className="px-2 py-1 border-b text-right">Exit Time</th>
            <th className="px-2 py-1 border-b text-right">損益</th>
            <th className="px-2 py-1 border-b text-center">操作</th>
            <th className="px-2 py-1 border-b text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.id}
              onClick={() => navigate(`/chart/${t.id}/${t.entry_time}`)}
              className="cursor-pointer hover:bg-gray-200"
            >
              <td className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(t.id)}
                  onChange={() => toggleSelect(t.id)}
                />
              </td>
              <td className="px-2 py-1 text-center">{t.id}</td>
              <td className="px-2 py-1 text-center">{t.pair}</td>
              <td
                className={`px-2 py-1 text-center font-semibold ${
                  t.side === '買' ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {t.side}
              </td>
              <td className="px-2 py-1 text-right">{t.lot}</td>
              <td className="px-2 py-1 text-right">{t.entry_rate}</td>
              <td className="px-2 py-1 text-right">{t.exit_rate}</td>
              <td className="px-2 py-1 text-right">
                {new Date(t.entry_time * 1000).toLocaleTimeString()}
              </td>
              <td className="px-2 py-1 text-right">
                {new Date(t.exit_time * 1000).toLocaleTimeString()}
              </td>
              <td className="px-2 py-1 text-right font-semibold">
                {formatProfit(displayMode, t.profit, t.profit_pips, false)}
              </td>
              <td className="px-2 py-1 text-center">
                <button
                  onClick={() => onLabelClick(t)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  ラベル登録
                </button>
              </td>
              <td className="px-2 py-1 text-center">
                {renderMemoButton(t.id, t.memo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
