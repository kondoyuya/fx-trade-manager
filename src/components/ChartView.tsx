import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  Time,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  CandlestickSeries,
  CandlestickData,
} from 'lightweight-charts'
import { invoke } from '@tauri-apps/api/core'
import { LabelSelectPopup } from '../components/LabelSelectButton'
import { UpdateOHLCButton } from '../components/UpdateOHLCButton'

interface ChartViewProps {}

interface Candle {
  time: number // UNIX秒
  open: number
  high: number
  low: number
  close: number
}

interface Trade {
  id: number
  pair: string
  side: string
  lot: number
  entry_rate: number
  exit_rate: number
  entry_time: number
  exit_time: number
  profit: number
  swap: number
  memo: string
}

// --- Primitive Classes ---
class DebugPaneView implements IPrimitivePaneView {
  private readonly _primitive: DebugPrimitive
  constructor(primitive: DebugPrimitive) {
    this._primitive = primitive
  }

  renderer() {
    const paneView = this
    return {
      draw: (target: any) => {
        target.useBitmapCoordinateSpace((scope: any) => {
          if (!scope.context) return
          const param = paneView._primitive.param()
          if (!param) return
          const { series, chart } = param
          const ctx = scope.context

          const trades = paneView._primitive.trades()
          const TIME_OFFSET = 3600 * 9

          for (const trade of trades) {
            const isSell = trade.side === '売'
            const arrowSize = 10

            const entryTimeFloor =
              Math.floor(trade.entry_time / paneView._primitive.interval()) *
              paneView._primitive.interval()
            const exitTimeFloor =
              Math.floor(trade.exit_time / paneView._primitive.interval()) *
              paneView._primitive.interval()

            const entryX = chart
              .timeScale()
              .timeToCoordinate((entryTimeFloor + TIME_OFFSET) as Time)
            const entryY = series.priceToCoordinate(trade.entry_rate)
            const exitX = chart
              .timeScale()
              .timeToCoordinate((exitTimeFloor + TIME_OFFSET) as Time)
            const exitY = series.priceToCoordinate(trade.exit_rate)

            if (
              entryX !== null &&
              entryY !== null &&
              exitX !== null &&
              exitY !== null
            ) {
              ctx.strokeStyle = 'black'
              ctx.lineWidth = 2
              ctx.setLineDash([7, 3])
              ctx.beginPath()
              ctx.moveTo(entryX, entryY)
              ctx.lineTo(exitX, exitY)
              ctx.stroke()
              ctx.setLineDash([])

              const drawArrow = (
                x: number,
                y: number,
                isUp: boolean,
                color: string,
              ) => {
                ctx.fillStyle = color
                ctx.beginPath()
                if (isUp) {
                  ctx.moveTo(x, y + arrowSize * 0.5)
                  ctx.lineTo(x - arrowSize * 0.5, y - arrowSize * 0.5)
                  ctx.lineTo(x + arrowSize * 0.5, y - arrowSize * 0.5)
                } else {
                  ctx.moveTo(x, y - arrowSize * 0.5)
                  ctx.lineTo(x - arrowSize * 0.5, y + arrowSize * 0.5)
                  ctx.lineTo(x + arrowSize * 0.5, y + arrowSize * 0.5)
                }
                ctx.closePath()
                ctx.fill()
              }

              const drawCloss = (x: number, y: number) => {
                ctx.strokeStyle = 'black'
                ctx.lineWidth = 2
                const size = 6
                ctx.beginPath()
                ctx.moveTo(x - size, y - size)
                ctx.lineTo(x + size, y + size)
                ctx.moveTo(x - size, y + size)
                ctx.lineTo(x + size, y - size)
                ctx.stroke()
              }

              const drawCircle = (x: number, y: number) => {
                const radius = 4
                ctx.strokeStyle = 'black'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(x, y, radius, 0, 2 * Math.PI)
                ctx.stroke()
              }

              const entryIsUp = isSell
              const entryColor = isSell ? 'blue' : 'red'
              drawArrow(entryX, entryY, entryIsUp, entryColor)

              if (trade.profit > 0) drawCircle(exitX, exitY)
              else drawCloss(exitX, exitY)
            }
          }
        })
      },
    }
  }
}

class DebugPrimitive implements ISeriesPrimitive<Time> {
  private _param: SeriesAttachedParameter<Time> | null = null
  private readonly _paneView: DebugPaneView
  private _trades: Trade[] = []
  private _interval: number // 秒

  constructor(interval: number) {
    this._interval = interval
    this._paneView = new DebugPaneView(this)
  }

  trades() {
    return this._trades
  }
  interval() {
    return this._interval
  }

  updateTrades(trades: Trade[]) {
    this._trades = trades
    if (this._param) this._param.requestUpdate()
  }

  attached(param: SeriesAttachedParameter<Time>) {
    this._param = param
  }
  detached() {
    this._param = null
  }
  paneViews() {
    return [this._paneView]
  }
  param() {
    return this._param
  }
  updateAllViews() {}
}

const ChartView: React.FC<ChartViewProps> = () => {
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const primitiveRef = useRef<DebugPrimitive | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const [interval, setInterval] = useState<number>(60) // デフォルト 1分足
  const [trades, setTrades] = useState<Trade[]>([])
  const [candles, setCandles] = useState<CandlestickData<Time>[]>([])
  const [visibleTrades, setVisibleTrades] = useState<Trade[]>([])
  const [searchTime, setSearchTime] = useState<string>('')
  const [showPopup, setShowPopup] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

  const handleLabelClick = (trade: Trade) => {
    setSelectedTrade(trade)
    setShowPopup(true)
  }

  // --- チャート再生成 ---
  useEffect(() => {
    async function fetchAndRender() {
      // 既存チャート破棄
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        primitiveRef.current = null
      }
      if (!chartContainerRef.current) return

      const chart = createChart(chartContainerRef.current, {
        width: 800,
        height: 600,
        timeScale: { timeVisible: true, barSpacing: 12, rightOffset: 10 },
      })
      chartRef.current = chart

      // ローソク足シリーズ
      const series = chart.addSeries(CandlestickSeries, {
        upColor: 'white',
        borderUpColor: 'black',
        wickUpColor: 'black',
        downColor: 'silver',
        borderDownColor: 'black',
        wickDownColor: 'black',
      })
      candleSeriesRef.current = series

      // Primitive
      const primitive = new DebugPrimitive(interval)
      primitiveRef.current = primitive
      series.attachPrimitive(primitive)

      // ローソク足取得
      try {
        const candles: Candle[] = await invoke('get_candles', { interval })
        const formatted = candles.map((c) => ({
          time: (c.time + 3600 * 9) as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
        series.setData(formatted)
        setCandles(formatted)

        // 初期表示
        const times = formatted.map((c) => c.time as number)
        const to = times[times.length - 1] as Time
        const from = times[Math.max(0, times.length - 100)] as Time
        chart.timeScale().setVisibleRange({ from, to })
      } catch (err) {
        console.error('ローソク足取得失敗:', err)
      }

      // トレード取得
      try {
        const data: Trade[] = await invoke('get_all_trades')
        setTrades(data)
        primitive.updateTrades(data)
      } catch (err) {
        console.error('トレード取得失敗:', err)
      }
    }

    fetchAndRender()
  }, [interval])

  // --- 可視範囲内トレード更新 ---
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || trades.length === 0) return

    const updateVisibleTrades = () => {
      const range = chart.timeScale().getVisibleRange()
      if (!range) return

      const fromUnix = (range.from as number) - 3600 * 9
      const toUnix = (range.to as number) - 3600 * 9

      const filtered = trades.filter(
        (t) =>
          (t.entry_time >= fromUnix && t.entry_time <= toUnix) ||
          (t.exit_time >= fromUnix && t.exit_time <= toUnix),
      )
      setVisibleTrades(filtered)
    }

    updateVisibleTrades()
    chart.timeScale().subscribeVisibleTimeRangeChange(updateVisibleTrades)
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(updateVisibleTrades)
    }
  }, [trades])

  // --- 指定時刻検索 ---
  const handleSearch = () => {
    if (!chartRef.current || !searchTime) return
    const targetUnix =
      Math.floor(new Date(searchTime).getTime() / 1000) + 3600 * 9
    const closest = candles.reduce((prev, curr) =>
      Math.abs((curr.time as number) - targetUnix) <
      Math.abs((prev.time as number) - targetUnix)
        ? curr
        : prev,
    )

    const rangeSize = 50
    const from = ((closest.time as number) - rangeSize * interval) as Time
    const to = ((closest.time as number) + rangeSize * interval) as Time
    chartRef.current.timeScale().setVisibleRange({ from, to })
  }

  return (
    <div className="flex flex-col items-center mt-4 space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="datetime-local"
          value={searchTime}
          onChange={(e) => setSearchTime(e.target.value)}
          className="border rounded p-1"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          検索
        </button>

        <select
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="border rounded p-1"
        >
          <option value={60}>1分足</option>
          <option value={300}>5分足</option>
          <option value={900}>15分足</option>
          <option value={3600}>1時間足</option>
          <option value={14400}>4時間足</option>
          <option value={86400}>日足</option>
        </select>

        <UpdateOHLCButton />
      </div>

      <div
        ref={chartContainerRef}
        style={{ width: '800px', height: '600px' }}
      />

      <div className="w-[800px] mt-4 border p-2 rounded bg-gray-50">
        <h2 className="font-bold mb-2">現在画面内のトレード</h2>
        {visibleTrades.length === 0 ? (
          <p className="text-gray-500">表示範囲内にトレードはありません。</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-200">
                <th className="p-1">#</th>
                <th className="p-1">通貨ペア</th>
                <th className="p-1">売買</th>
                <th className="p-1">Lot</th>
                <th className="p-1">Entry</th>
                <th className="p-1">Exit</th>
                <th className="p-1">損益</th>
                <th className="p-1">操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrades.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-1 text-center">{t.id}</td>
                  <td className="p-1 text-center">{t.pair}</td>
                  <td
                    className={`p-1 text-center ${t.side === '買' ? 'text-red-600' : 'text-blue-600'}`}
                  >
                    {t.side}
                  </td>
                  <td className="p-1 text-right">{t.lot}</td>
                  <td className="p-1 text-right">
                    {new Date(t.entry_time * 1000).toLocaleString()}
                  </td>
                  <td className="p-1 text-right">
                    {new Date(t.exit_time * 1000).toLocaleString()}
                  </td>
                  <td
                    className={`p-1 text-right ${t.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {t.profit.toFixed(0)}
                  </td>
                  <td className="p-1 text-center">
                    <button
                      onClick={() => handleLabelClick(t)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    >
                      ラベル登録
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showPopup && selectedTrade && (
          <LabelSelectPopup
            trade={selectedTrade}
            onClose={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  )
}

export default ChartView
