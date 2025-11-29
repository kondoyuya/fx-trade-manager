import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const UpdateTickButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      await invoke<string>('fetch_and_update_tick');
      alert('更新に成功しました');
    } catch (err) {
      console.error(err);

      let msg = '不明なエラー';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else {
        msg = JSON.stringify(err);
      }

      alert('DB更新に失敗しました: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        text-white 
        px-4 py-2 
        rounded-lg 
        shadow-md 
        transition 
        duration-150 
        ease-in-out
        focus:outline-none
        focus:ring-2
        focus:ring-blue-400
        ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
        }
      `}
    >
      {
        // ⑦ ローディング状態に応じてボタンテキストを変更
        isLoading 
          ? (
            <>
              更新中...
            </>
          )
          : '最新のtickデータを取得'
      }
    </button>
  );
};
