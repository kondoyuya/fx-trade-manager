import React, { useEffect, useState } from 'react'
import { Trade } from '../types'
import { TradeHistogram } from './TradeHistogram'

type Props = {
  trades: Trade[]
  displayMode: '円' | 'pips'
}

export const TradeHistogramPanel: React.FC<Props> = ({
  trades,
  displayMode,
}) => {
  const [binSize, setBinSize] = useState(displayMode === '円' ? 5000 : 0.5)
  const [capValue, setCapValue] = useState(displayMode === '円' ? 100000 : 10)

  useEffect(() => {
    setBinSize(displayMode === '円' ? 5000 : 0.5)
    setCapValue(displayMode === '円' ? 100000 : 10)
  }, [displayMode])

  return (
    <div className="space-y-4">
      {/* --- BIN / CAP 入力欄 --- */}
      <div className="flex gap-6 items-end">
        <div>
          <label className="block text-sm">BIN 幅 ({displayMode})</label>
          <input
            type="number"
            value={binSize}
            onChange={(e) => setBinSize(Number(e.target.value))}
            className="border rounded p-1 w-24"
          />
        </div>

        <div>
          <label className="block text-sm">
            CAP（外れ値閾値） ({displayMode})
          </label>
          <input
            type="number"
            value={capValue}
            onChange={(e) => setCapValue(Number(e.target.value))}
            className="border rounded p-1 w-24"
          />
        </div>
      </div>

      {/* --- ヒストグラム本体 --- */}
      <TradeHistogram
        trades={trades}
        displayMode={displayMode}
        binSize={binSize}
        capValue={capValue}
      />
    </div>
  )
}
