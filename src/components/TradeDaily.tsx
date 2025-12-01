import React, { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Linkify from 'linkify-react'

interface Props {
  selectedDate: Date
}

export const TradeDaily: React.FC<Props> = ({ selectedDate }) => {
  const [memo, setMemo] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const linkifyOptions = {
    target: "_blank",
    rel: "noopener noreferrer",
    className: "text-blue-600 underline hover:text-blue-800"
  }

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
        memo,
      })
      alert('メモを保存しました')
      setEditMode(false)
    } catch (e) {
      console.error('Failed to save memo', e)
      alert('保存に失敗しました')
    }
  }

  useEffect(() => {
    fetchMemo()
  }, [selectedDate])

  return (
    <div className="mt-4 p-3 border rounded bg-gray-50">
      {/* タイトル & ボタン */}
      <div className="relative flex justify-between items-center mb-2">
        <h3 className="font-bold">
          {selectedDate.toLocaleDateString()} のメモ
        </h3>
        {!editMode ? (
          <button
            className="absolute right-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-gray-300"
            onClick={() => {
              setEditMode(true)
            }}
          >
            編集
          </button>
        ) : (
          <div className="absolute right-2 flex gap-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={saveMemo}
              disabled={saving}
            >
              {saving ? "保存中…" : "保存"}
            </button>
            <button
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              onClick={() => setEditMode(false)}
            >
              キャンセル
            </button>
          </div>
        )}
      </div>

      {/* 編集モード：textarea */}
      {editMode && (
        <textarea
          className="w-full h-28 p-2 border rounded"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="この日の振り返りやメモを書いてください..."
        />
      )}

      {/* 表示モード：リンク付きプレビュー */}
      {!editMode && (
        <div className="mt-3 p-3 bg-white border rounded whitespace-pre-wrap text-sm min-h-28">
          {memo.trim() === "" ? (
            <span className="text-gray-400">メモはありません</span>
          ) : (
            <Linkify options={linkifyOptions}>{memo}</Linkify>
          )}
        </div>
      )}
    </div>
  )
}
