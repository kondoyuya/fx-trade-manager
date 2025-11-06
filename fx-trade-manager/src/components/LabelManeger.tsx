import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function LabelManager() {
  const [showPopup, setShowPopup] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ラベル追加処理 ---
  async function handleAddLabel() {
    if (!newLabelName.trim()) {
      setError("ラベル名を入力してください");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await invoke("add_label", ({ name: newLabelName }));

      setNewLabelName("");
      setShowPopup(false); // 登録成功したら閉じる
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setShowPopup(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          ＋ ラベル追加
        </button>
      </div>

      {/* ラベル一覧 */}
      <ul className="space-y-1">
        {labels.map((label) => (
          <li
            key={label.id}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            {label.name}
          </li>
        ))}
      </ul>

      {/* ポップアップ */}
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

            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}

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
                {loading ? "登録中..." : "登録"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
