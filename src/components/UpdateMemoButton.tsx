import { useState } from 'react'
import { useUpdateMemo } from '../hooks/useUpdateMemo'

interface UpdateMemoButtonProps {
  tradeId?: number // トレードID
  memoContent?: string // メモ内容の現状値
  buttonLabel?: string // ボタンの文言をカスタマイズ
}

export const UpdateMemoButton: React.FC<UpdateMemoButtonProps> = ({
  tradeId,
  memoContent = '',
  buttonLabel = '＋ メモ編集',
}) => {
  const [showPopup, setShowPopup] = useState(false)
  const [updateMemoContent, setUpdateMemoContent] = useState(memoContent)

  const { updateMemo, loading, error, setError } = useUpdateMemo()

  // tradeId がない場合は何もしない
  if (!tradeId) return null

  async function handleUpdateMemo() {
    const success = await updateMemo(tradeId!, updateMemoContent)
    if (success) {
      setUpdateMemoContent(updateMemoContent)
      setShowPopup(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null)
          setShowPopup(true)
        }}
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
      >
        {buttonLabel}
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <label htmlFor="memo-content" className="text-lg font-bold mb-4">
              メモを編集
            </label>
            <textarea
              id="memo-content"
              value={updateMemoContent}
              onChange={(e) => setUpdateMemoContent(e.target.value)}
              placeholder="メモ内容を入力"
              className="border rounded w-full p-2 mb-3"
              disabled={loading}
            />

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPopup(false)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateMemo}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '登録中...' : '登録'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
