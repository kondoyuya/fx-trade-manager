import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useAddLabel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addLabel(newLabelName: string): Promise<boolean> {
    if (!newLabelName.trim()) {
      setError("ラベル名を入力してください");
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      await invoke("add_label", { name: newLabelName });
      return true;
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { addLabel, loading, error, setError };
}
