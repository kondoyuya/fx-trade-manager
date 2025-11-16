import { useState } from 'react'
import { useAddLabel } from '../hooks/useAddLabel'

interface AddLabelButtonProps {
  onAdded?: (labelName: string) => void // 登録後に親へ通知
  buttonLabel?: string // ボタンの文言をカスタマイズ
}

export const AddLabelButton: React.FC<AddLabelButtonProps> = ({
  onAdded,
  buttonLabel = '＋ ラベル追加',
}) => {
  const [showPopup, setShowPopup] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')

  const { addLabel, loading, error, setError } = useAddLabel()

  async function handleAddLabel() {
    const success = await addLabel(newLabelName)
    if (success) {
      onAdded?.(newLabelName)
      setNewLabelName('')
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
            <h3 className="text-lg font-bold mb-4">ラベルを追加</h3>

            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="ラベル名を入力"
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
                onClick={handleAddLabel}
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
