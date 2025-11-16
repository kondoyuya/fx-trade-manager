import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Label {
  id: number
  name: string
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

interface LabelSelectPopupProps {
  trade: Trade | null
  onClose: () => void
}

export const LabelSelectPopup: React.FC<LabelSelectPopupProps> = ({
  trade,
  onClose,
}) => {
  const [labels, setLabels] = useState<Label[]>([])
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // すべてのラベル + トレードに紐づくラベルを取得
  useEffect(() => {
    async function fetchLabels() {
      if (!trade) return
      try {
        const allLabels = await invoke<Label[]>('get_all_labels')
        setLabels(allLabels)

        const tradeLabelIds = await invoke<number[]>('get_labels_for_trade', {
          tradeId: trade.id,
        })
        setSelectedLabelIds(tradeLabelIds)
      } catch (error) {
        console.error('❌ Failed to fetch labels:', error)
      }
    }
    fetchLabels()
  }, [trade])

  // ラベル選択トグル
  function toggleLabelSelection(labelId: number) {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    )
  }

  // 登録・解除処理
  async function handleRegister() {
    if (!trade) return
    setLoading(true)

    try {
      // 現在の登録済みラベルを取得
      const currentLabels = await invoke<number[]>('get_labels_for_trade', {
        tradeId: trade.id,
      })

      // 差分を計算
      const toAdd = selectedLabelIds.filter((id) => !currentLabels.includes(id))
      const toRemove = currentLabels.filter(
        (id) => !selectedLabelIds.includes(id),
      )

      // 追加
      for (const labelId of toAdd) {
        await invoke('add_trade_label', {
          tradeId: trade.id,
          labelId,
        })
      }

      // 削除
      for (const labelId of toRemove) {
        await invoke('delete_trade_label', {
          tradeId: trade.id,
          labelId,
        })
      }

      onClose()
    } catch (error) {
      console.error('❌ Failed to update labels:', error)
      alert('ラベルの更新に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-3">ラベルを編集</h2>
        <p className="text-sm text-gray-500 mb-3">トレードID: {trade?.id}</p>

        <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
          {labels.length > 0 ? (
            labels.map((label) => (
              <div
                key={label.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedLabelIds.includes(label.id)
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => toggleLabelSelection(label.id)}
              >
                {label.name}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">ラベルがありません。</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            className={`px-3 py-1 rounded text-white ${
              loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? '更新中...' : '登録を更新'}
          </button>
        </div>
      </div>
    </div>
  )
}
