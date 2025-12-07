import React, { useState } from 'react'
import { open } from '@tauri-apps/plugin-shell'

interface IndicatorButtonProps {
  date: Date
  buttonLabel?: string
}

export const IndicatorButton: React.FC<IndicatorButtonProps> = ({
  date,
  buttonLabel = '指標を確認',
}) => {
  const [showPopup, setShowPopup] = useState(false)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  // リンク一覧
  const links = [
    {
      label: '羊飼いのFXブログ',
      url: `https://kissfx.com/article/fxdays${yyyy}${mm}${dd}.html`,
    },
    {
      label: 'みんかぶ - 経済指標カレンダー',
      url: `https://fx.minkabu.jp/indicators?date=${yyyy}-${mm}-${dd}`,
    },
  ]

  const handleOpen = (url: string) => {
    open(url)
    setShowPopup(false)
  }

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="bg-gray-100 text-blue-500 border border-blue-600 px-3 py-1 rounded hover:bg-gray-200"
      >
        {buttonLabel}
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-5 w-80">
            <h3 className="text-lg font-bold mb-4">開くページを選択</h3>

            <div className="space-y-2">
              {links.map((site) => (
                <button
                  key={site.url}
                  onClick={() => handleOpen(site.url)}
                  className="w-full border px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                  {site.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowPopup(false)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
