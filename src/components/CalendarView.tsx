import React, { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { invoke } from '@tauri-apps/api/core'
import { DailySummary, Trade } from '../types'
import 'react-calendar/dist/Calendar.css'
import { LabelSelectPopup } from '../components/LabelSelectButton'
import { UpdateMemoButton } from '../components/UpdateMemoButton'
import { DisplayModeToggle } from '../components/DisplayModeToggle'
import { TradeTable } from '../components/TradeTable'
import { TradeDaily } from '../components/TradeDaily'
import { TradeSummaryView } from '../components/TradeSummaryView'
import { formatProfit } from './format/Profit'
import { IndicatorButton } from './IndicatorButton'

const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [displayMode, setDisplayMode] = useState<'円' | 'pips'>('円')
  const [activeMonth, setActiveMonth] = useState<Date>(new Date())
  const [showCount, setShowCount] = useState(false);

  async function fetchSummary() {
    try {
      const data = await invoke<DailySummary[]>('get_daily_records')
      setSummaries(data)
      console.log(data)
    } catch (err) {
      console.error('Failed to fetch summaries:', err)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const getSummaryFromDate = (date: Date): DailySummary | null => {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    const dateStr = `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, '0')}-${String(jst.getDate()).padStart(2, '0')}`
    return summaries.find((s) => s.date === dateStr) ?? null
  }

  const handleLabelClick = (trade: Trade) => {
    setSelectedTrade(trade)
    setShowPopup(true)
  }

  const getMonthlyProfit = (date: Date): { yen: number; pips: number } => {
    const year = date.getFullYear()
    const month = date.getMonth()

    const monthlySummaries = summaries.filter((s) => {
      const sDate = new Date(s.date)
      return sDate.getFullYear() === year && sDate.getMonth() === month
    })

    const yenProfit = monthlySummaries.reduce(
      (sum, s) => sum + (s.summary.profit ?? 0),
      0,
    )

    const pipsProfit = monthlySummaries.reduce(
      (sum, s) => sum + (s.summary.profit_pips ?? 0),
      0,
    )

    return { yen: yenProfit, pips: pipsProfit }
  }

  const tradesForDate = getSummaryFromDate(selectedDate)?.summary.trades ?? []
  const monthly = getMonthlyProfit(activeMonth)

  return (
    <main className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-4">
        <div className="mb-4 flex items-center gap-4">
          <DisplayModeToggle value={displayMode} onChange={setDisplayMode} />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              className={`relative w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition
                ${showCount ? "bg-blue-500" : "bg-gray-300"}`}
              onClick={() => setShowCount(!showCount)}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition
                  ${showCount ? "translate-x-5" : "translate-x-0"}`}
              ></div>
            </div>
            <span className="text-sm">回数を表示</span>
          </label>
        </div>
      </div>

      <div className="flex space-x-4">
        {/* 左：カレンダー */}
        <div className="relative">
          <Calendar
            showFixedNumberOfWeeks={true} 
            calendarType="gregory"
            onClickDay={(value) => setSelectedDate(value)}
            onActiveStartDateChange={({ activeStartDate }) =>
              setActiveMonth(activeStartDate!)
            }
            tileDisabled={({ date, view }) => {
              if (view !== 'month') return false
              return date.getMonth() !== activeMonth.getMonth()
            }}
            tileClassName={({ date, view }) => {
              if (view === 'month' && date.getMonth() !== activeMonth.getMonth()) {
                return 'hidden-tile'
              }
              return ''
            }}
            tileContent={({ date }) => {
              const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
              const dateStr = `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2,'0')}-${String(jst.getDate()).padStart(2,'0')}`
              const summary = summaries.find((s) => s.date === dateStr)?.summary
              if (!summary) return null

              const profit =
                displayMode === '円' ? summary.profit : summary.profit_pips / 10
              const color =
                profit > 0 ? 'text-blue-600' : profit < 0 ? 'text-red-600' : 'text-gray-400'

              return (
                <div className="flex flex-col items-center leading-tight">
                  {showCount && (
                    <p className="text-[10px] text-gray-400">{summary.count}回</p>
                  )}
                  <p className={`text-xs ${profit !== 0 ? 'font-bold' : ''} ${color}`}>
                    {(profit > 0 ? '+' : '') + profit.toFixed(displayMode === '円' ? 0 : 1)}
                  </p>
                </div>
              )
            }}
          />

        {/* 月次収支タイル */}
        <div className="absolute left-[25%] top-[87%] w-[50%] flex justify-center">
          <div className="text-white border-2 border-blue-600 font-bold w-35 h-10 rounded-full px-2 py-1 text-sm flex justify-center items-center shadow-lg">
            {formatProfit(displayMode, monthly.yen, monthly.pips)}
          </div>
        </div>

        </div>

        {/* 右：日付詳細 + トレード一覧 */}
        <div className="flex-1 max-h-[570px] overflow-y-auto border rounded p-2">
          <h2 className="font-bold mb-2">
            {selectedDate.toLocaleDateString()} の詳細
            <span className="ml-3">
              <IndicatorButton date={selectedDate} />
            </span>
          </h2>

          <TradeSummaryView
            summary={getSummaryFromDate(selectedDate)?.summary ?? null}
            displayMode={displayMode}
          />

          <TradeTable
            trades={tradesForDate}
            displayMode={displayMode}
            onLabelClick={handleLabelClick}
            renderMemoButton={(id, memo) => (
              <UpdateMemoButton tradeId={id} memoContent={memo ?? ''} />
            )}
            onMerged={fetchSummary}
          />
        </div>
      </div>

      <TradeDaily selectedDate={selectedDate} />

      {/* ラベル登録ポップアップ */}
      {showPopup && selectedTrade && (
        <LabelSelectPopup
          trade={selectedTrade}
          onClose={() => setShowPopup(false)}
        />
      )}
    </main>
  )
}

export default CalendarView
