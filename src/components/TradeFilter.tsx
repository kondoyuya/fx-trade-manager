import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

export interface TradeFilterValues {
  startDate: string
  endDate: string
  minHoldingEnabled: boolean
  minHoldingTime: string
  maxHoldingEnabled: boolean
  maxHoldingTime: string
  selectedLabelIds: number[]
  labelEnabled: boolean
}

interface Label {
  id: number
  name: string
}

interface TradeFilterProps {
  values: TradeFilterValues
  onChange: (values: TradeFilterValues) => void
  onApply: () => void
}

export const TradeFilter: React.FC<TradeFilterProps> = ({
  values,
  onChange,
  onApply,
}) => {
  const [expanded, setExpanded] = useState(true)
  const [allLabels, setAllLabels] = useState<Label[]>([])

  useEffect(() => {
    async function fetchLabels() {
      try {
        const labels = await invoke<Label[]>('get_all_labels')
        setAllLabels(labels)
      } catch (e) {
        console.error("ラベル取得失敗:", e)
      }
    }
    fetchLabels()
  }, [])

  const update = (field: Partial<TradeFilterValues>) => {
    onChange({ ...values, ...field })
  }

  function toggleLabel(labelId: number) {
    const newIds = values.selectedLabelIds.includes(labelId)
      ? values.selectedLabelIds.filter((id) => id !== labelId)
      : [...values.selectedLabelIds, labelId]

    update({ selectedLabelIds: newIds })
  }


  return (
    <div className="border rounded-lg bg-gray-50 mb-4">
      <div
        className="flex justify-between items-center p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-semibold text-lg">フィルター</span>
        <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* 日付 + 更新ボタン */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                開始日:
                <input
                  type="date"
                  value={values.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className="border px-2 py-1 rounded"
                />
              </label>
              <label className="flex items-center gap-2">
                終了日:
                <input
                  type="date"
                  value={values.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className="border px-2 py-1 rounded"
                />
              </label>
            </div>
            <button
              onClick={onApply}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              更新
            </button>
          </div>

          {/* 保有時間 */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.minHoldingEnabled}
                onChange={(e) =>
                  update({ minHoldingEnabled: e.target.checked })
                }
              />
              最小保有時間:
              <input
                type="time"
                step={1}
                value={values.minHoldingTime}
                onChange={(e) => update({ minHoldingTime: e.target.value })}
                className="border px-2 py-1 rounded"
                disabled={!values.minHoldingEnabled}
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.maxHoldingEnabled}
                onChange={(e) =>
                  update({ maxHoldingEnabled: e.target.checked })
                }
              />
              最大保有時間:
              <input
                type="time"
                step={1}
                value={values.maxHoldingTime}
                onChange={(e) => update({ maxHoldingTime: e.target.value })}
                className="border px-2 py-1 rounded"
                disabled={!values.maxHoldingEnabled}
              />
            </label>
          </div>

          {/* ラベル */}
          <div>
            <input
              type="checkbox"
              checked={values.labelEnabled}
              onChange={(e) =>
                update({ labelEnabled: e.target.checked })
              }
            />
            ラベルで絞り込み

            <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2 bg-white">
  {allLabels.length > 0 ? (
    allLabels.map((label) => {
      const selected = values.selectedLabelIds.includes(label.id)

      return (
        <div
          key={label.id}
          onClick={() => values.labelEnabled && toggleLabel(label.id)}
          className={`p-2 rounded cursor-pointer ${
            !values.labelEnabled
              ? "opacity-40 cursor-not-allowed"
              : selected
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-100"
          }`}
        >
          {label.name}
        </div>
      )
    })
  ) : (
    <p className="text-gray-400 text-sm">ラベルがありません</p>
  )}
</div>
          </div>
        </div>
      )}
    </div>
  )
}
