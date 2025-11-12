import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useUpdateMemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateMemo(tradeId: number, updateMemoContent: string): Promise<boolean> {
    if (!updateMemoContent.trim()) {
      setError("メモ内容を入力してください");
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      await invoke("update_memo", { id: tradeId, memoContent: updateMemoContent });
      return true;
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { updateMemo, loading, error, setError };
}