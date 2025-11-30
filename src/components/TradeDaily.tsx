import React, { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Props {
  selectedDate: Date
}

export const TradeDaily: React.FC<Props> = ({ selectedDate }) => {
  const [memo, setMemo] = useState("")

  function toDateStr(date: Date): string {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(jst.getDate()).padStart(2, '0')}`
  }

  async function fetchMemo() {
    try {
      const memoText = await invoke<string>('get_daily_memo', {
        date: toDateStr(selectedDate),
      })
      setMemo(memoText || '')
    } catch (e) {
      console.error('Failed to fetch daily memo', e)
    }
  }

  async function saveMemo() {
    try {
      await invoke('upsert_daily_memo', {
        date: toDateStr(selectedDate),
        memo: memo,
      })
      alert('メモを保存しました')
    } catch (e) {
      console.error('Failed to save memo', e)
      alert('保存に失敗しました')
    }
  }

  // 日付変更時にメモを読み込む
  useEffect(() => {
    fetchMemo()
  }, [selectedDate])

  return (
    <div className="mt-4 p-3 border rounded bg-gray-50">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">
            {selectedDate.toLocaleDateString()} のメモ
            </h3>
            <button
            onClick={saveMemo}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
            保存
            </button>
        </div>

        <textarea
            className="w-full h-28 p-2 border rounded"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="この日の振り返りやメモを書いてください..."
        />
    </div>
  )
}
