import React, { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUpdater } from '../hooks/useUpdater';

export const UpdaterDialog: React.FC = () => {
  const { updateInfo, checkForUpdates } = useUpdater();

  useEffect(() => {
    // アプリケーション起動時にアップデートを確認
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000); // 3秒後に確認開始

    return () => clearTimeout(timer);
  }, []);

  const handleInstallUpdate = async () => {
    try {
      await invoke('install_update');
    } catch (error) {
      console.error(
        'アップデートのインストールに失敗:',
        error
      );
    }
  };

  console.log(updateInfo)
  if (!updateInfo.available) return null;

  return (
    // 半透明の背景でモーダル化
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full text-center">
        <h3 className="text-lg font-bold mb-4">新しいバージョンが利用可能です</h3>
        <p className="mb-2">バージョン: {updateInfo.version}</p>

        {updateInfo.downloading && <p className="mb-2">ダウンロード中...</p>}
        {updateInfo.installing && <p className="mb-2">インストール中...</p>}

        {!updateInfo.downloading && !updateInfo.installing && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleInstallUpdate}
          >
            今すぐアップデート
          </button>
        )}

        {updateInfo.error && (
          <p className="text-red-500 mt-2">エラー: {updateInfo.error}</p>
        )}
      </div>
    </div>
  );
};
