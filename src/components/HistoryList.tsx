import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LabelSelectPopup } from "../components/LabelSelectButton";
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
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

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

      {showPopup && (
        <LabelSelectPopup
          trade={selectedTrade}
          onClose={() => setShowPopup(false)}
        />
      )}
    </main>
  );
};

export default HistoryList;
