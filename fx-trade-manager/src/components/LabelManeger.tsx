import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AddLabelButton } from "../components/AddLabelButton";

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
  trades: Trade[];
}

const LabelManager: React.FC = () => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);

  useEffect(() => {
    async function fetchLabels() {
      try {
        const data = await invoke<Label[]>("get_all_labels_with_trade");
        console.log("📄 Labels fetched:", data);
        setLabels(data);
      } catch (error) {
        console.error("❌ Failed to fetch labels:", error);
      }
    }

    fetchLabels();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* ラベル追加ボタン */}
      <div className="flex justify-between items-center mb-3">
        <AddLabelButton
          onAdded={(name) => {
            setLabels((prev) => [...prev, { id: Date.now(), name, trades: [] }]);
          }}
        />
      </div>

      {/* ラベル一覧 */}
      <ul className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <li
            key={label.id}
            className={`px-3 py-1 rounded-full cursor-pointer text-sm shadow-sm transition 
              ${
                selectedLabel?.id === label.id
                  ? "bg-blue-400 text-white"
                  : "bg-gray-100 hover:bg-blue-100"
              }`}
            onClick={() =>
              setSelectedLabel(selectedLabel?.id === label.id ? null : label)
            }
          >
            {label.name}
          </li>
        ))}
      </ul>

      {/* 選択中ラベルのトレード一覧 */}
      {selectedLabel && (
        <div className="mt-4 p-3 border rounded-lg bg-gray-50 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">
            {selectedLabel.name} のトレード一覧
          </h2>

          {selectedLabel.trades.length > 0 ? (
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="border px-2 py-1">ペア</th>
                  <th className="border px-2 py-1">売買</th>
                  <th className="border px-2 py-1">ロット</th>
                  <th className="border px-2 py-1">利益</th>
                  <th className="border px-2 py-1">エントリー</th>
                  <th className="border px-2 py-1">決済</th>
                </tr>
              </thead>
              <tbody>
                {selectedLabel.trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-100">
                    <td className="border px-2 py-1 text-center">
                      {trade.pair}
                    </td>
                    <td
                      className={`border px-2 py-1 text-center font-semibold ${
                        trade.side === "BUY"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {trade.side}
                    </td>
                    <td className="border px-2 py-1 text-right">{trade.lot}</td>
                    <td
                      className={`border px-2 py-1 text-right ${
                        trade.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {trade.profit.toFixed(2)}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {new Date(trade.entry_time * 1000).toLocaleString()}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {new Date(trade.exit_time * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">トレードがありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LabelManager;
