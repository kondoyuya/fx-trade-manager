import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface UpdateInfo {
  version: string;
  available: boolean;
  downloading: boolean;
  installing: boolean;
  error?: string;
}

export interface UpdaterEvents {
  'update-available': { version: string };
  'update-downloaded': void;
  'update-installed': void;
  'update-error': { error: string };
}

export const useUpdater = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    version: '',
    available: false,
    downloading: false,
    installing: false,
  });

  // アップデート確認の実行
  const checkForUpdates = async () => {
    try {
      const version = await invoke<string | null>(
        'check_for_updates'
      );

      console.log(version)

      if (version) {
        setUpdateInfo((prev) => ({
          ...prev,
          version: version,
          available: true,
        }));
      }
    } catch (error) {
      setUpdateInfo((prev) => ({
        ...prev,
        error: error as string,
      }));
    }
  };

  return {
    updateInfo,
    checkForUpdates,
  };
};
