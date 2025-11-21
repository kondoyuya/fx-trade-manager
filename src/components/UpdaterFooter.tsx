import React, { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useUpdater } from '../hooks/useUpdater'

export const UpdaterFooter: React.FC = () => {
  const { updateInfo, checkForUpdates } = useUpdater()
  const [closed, setClosed] = useState(false) // ユーザーが閉じたら非表示

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleInstallUpdate = async () => {
    try {
      await invoke('install_update')
    } catch (error) {
      console.error('アップデートのインストールに失敗:', error)
    }
  }

  if (!updateInfo.available || closed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white py-3 px-4 flex items-center justify-between shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span className="font-semibold">新しいバージョンが利用可能です</span>
        <span className="opacity-80">v{updateInfo.version}</span>

        {updateInfo.downloading && <span>（ダウンロード中...）</span>}
        {updateInfo.installing && <span>（インストール中...）</span>}
        {updateInfo.error && (
          <span className="text-red-300">エラー: {updateInfo.error}</span>
        )}
      </div>

      {!updateInfo.downloading && !updateInfo.installing && (
        <div className="flex items-center gap-3">
          <button
            className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
            onClick={handleInstallUpdate}
          >
            今すぐアップデート
          </button>

          <button
            className="text-white opacity-75 hover:opacity-100"
            onClick={() => setClosed(true)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
