import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { TradeSummary } from '../types'
import {
  getStartOfMonthString,
  getTodayString,
  parseTimeToSeconds,
} from '../utils/time'
import { TradeSummaryView } from './TradeSummaryView'
import { DisplayModeToggle, DisplayMode } from '../components/DisplayModeToggle'
import { TradeTable } from '../components/TradeTable'
import { TradeFilter, TradeFilterValues } from '../components/TradeFilter'
import { TradePlot } from '../components/TradePlot'

export const TradeList: React.FC = () => {
  const [summary, setSummary] = useState<TradeSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('円')
  const [activeTab, setActiveTab] = useState<'list' | 'plot'>('list')
  const [filterValues, setFilterValues] = useState<TradeFilterValues>({
    startDate: getStartOfMonthString(),
    endDate: getTodayString(),
    minHoldingEnabled: false,
    minHoldingTime: '00:00:00',
    maxHoldingEnabled: false,
    maxHoldingTime: '00:00:00',
  })

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const filter: any = {
        start_date: filterValues.startDate,
        end_date: filterValues.endDate,
      }
      if (filterValues.minHoldingEnabled)
        filter.min_holding_time = parseTimeToSeconds(
          filterValues.minHoldingTime,
        )
      if (filterValues.maxHoldingEnabled)
        filter.max_holding_time = parseTimeToSeconds(
          filterValues.maxHoldingTime,
        )

      const result = await invoke<TradeSummary>('get_filtered_trades_summary', {
        filter,
      })
      setSummary(result)
    } catch (err) {
      console.error(err)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  if (loading) return <div className="p-4">読み込み中...</div>

  return (
    <div className="p-6 font-sans">
      <h2 className="text-2xl font-semibold mb-4">トレード統計</h2>

      {/* 円/pips切り替え */}
      <div className="mb-4">
        <DisplayModeToggle value={displayMode} onChange={setDisplayMode} />
      </div>

      {/* フィルター */}
      <TradeFilter
        values={filterValues}
        onChange={setFilterValues}
        onApply={fetchTrades}
      />

      {summary ? (
        <>
          <TradeSummaryView summary={summary} displayMode={displayMode} />

          <div className="flex gap-4 border-b mb-4">
            <button
              className={`pb-2 ${
                activeTab === 'list' ? 'border-b-2 border-blue-500' : ''
              }`}
              onClick={() => setActiveTab('list')}
            >
              一覧
            </button>
            <button
              className={`pb-2 ${
                activeTab === 'plot' ? 'border-b-2 border-blue-500' : ''
              }`}
              onClick={() => setActiveTab('plot')}
            >
              プロット
            </button>
          </div>

          <div className="mt-4 h-[55vh] overflow-y-auto border rounded-lg p-3">
            {activeTab === 'list' && (
              <TradeTable
                trades={summary.trades}
                displayMode={displayMode}
                onLabelClick={() => {}}
                renderMemoButton={() => null}
              />
            )}

            {activeTab === 'plot' && (
              <TradePlot trades={summary.trades} displayMode={displayMode} />
            )}
          </div>
        </>
      ) : (
        <div>該当データがありません。</div>
      )}
    </div>
  )
}

export default TradeList
