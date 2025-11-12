import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { UpdateMemoButton } from "../components/UpdateMemoButton";

interface Trade {
  id: number;
  pair: string;
  side: string;
  lot: number;
  entry_rate: number;
  exit_rate: number;
  entry_time: number;
  exit_time: number;
  profit: number;
  swap: number;
  memo: string;
}

interface Label {
  id: number;
  name: string;
}

function unixToJstString(unix: number): string {
  const date = new Date(unix * 1000);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
}

const HistoryList: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);

  // 初期ロード：トレード一覧
  useEffect(() => {
    async function fetchTrades() {
      try {
        const data = await invoke<Trade[]>("get_all_trades");
        setTrades(data);
      } catch (error) {
        console.error("❌ Failed to fetch trades:", error);
      }
    }
    fetchTrades();
  }, []);

  // ポップアップ表示時にラベル一覧を取得
  useEffect(() => {
    if (showPopup) {
      async function fetchLabels() {
        try {
          const data = await invoke<Label[]>("get_all_labels");
          console.log("fetch labels", data)
          setLabels(data);
        } catch (error) {
          console.error("❌ Failed to fetch labels:", error);
        }
      }
      fetchLabels();
    }
  }, [showPopup]);

  // ラベル登録処理
  async function handleRegisterLabel() {
    if (!selectedTrade || selectedLabelId === null) return;

    try {
      await invoke("add_trade_label", {
        tradeId: selectedTrade.id,
        labelId: selectedLabelId,
      });
      alert("✅ ラベルを登録しました！");
      setShowPopup(false);
      setSelectedTrade(null);
      setSelectedLabelId(null);
    } catch (error) {
      console.error("❌ Failed to register label:", error);
      alert("ラベル登録に失敗しました。");
    }
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Trades</h1>
      <p className="mb-4">Total trades: {trades.length}</p>

      <table className="table-auto border-collapse border border-gray-300 w-full">
        <thead>
          <tr className="bg-gray-100">
            {[
              "ID",
              "Pair",
              "Side",
              "Lot",
              "Entry Rate",
              "Exit Rate",
              "Entry Time",
              "Exit Time",
              "Profit",
              "Swap",
              "Memo",
              "Label",
            ].map((h) => (
              <th key={h} className="border border-gray-300 p-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((r) => (
            <tr key={r.id}>
              <td className="border border-gray-300 p-2">{r.id}</td>
              <td className="border border-gray-300 p-2">{r.pair}</td>
              <td className="border border-gray-300 p-2">{r.side}</td>
              <td className="border border-gray-300 p-2">{r.lot}</td>
              <td className="border border-gray-300 p-2">{r.entry_rate}</td>
              <td className="border border-gray-300 p-2">{r.exit_rate}</td>
              <td className="border border-gray-300 p-2">
                {unixToJstString(r.entry_time)}
              </td>
              <td className="border border-gray-300 p-2">
                {unixToJstString(r.exit_time)}
              </td>
              <td className="border border-gray-300 p-2">{r.profit}</td>
              <td className="border border-gray-300 p-2">{r.swap}</td>
              <td className="border border-gray-300 p-2"><UpdateMemoButton tradeId={r.id} memoContent={r.memo} /></td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => {
                    setSelectedTrade(r);
                    setShowPopup(true);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  ＋ ラベル登録
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ ポップアップ */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-3">ラベルを登録</h2>
            <p className="text-sm text-gray-500 mb-3">
              トレードID: {selectedTrade?.id}
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
              {labels.length > 0 ? (
                labels.map((label) => (
                  <div
                    key={label.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedLabelId === label.id
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedLabelId(label.id)}
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
                onClick={() => setShowPopup(false)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleRegisterLabel}
                disabled={selectedLabelId === null}
                className={`px-3 py-1 rounded text-white ${
                  selectedLabelId === null
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default HistoryList;
