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

interface LabelSummary {
  id: number;
  name: string;
  profit: number;
  profit_pips: number;
  count: number;
  wins: number;
  losses: number;
  total_holding_time: number;
  trades: Trade[];
}

const LabelManager: React.FC = () => {
  const [labels, setLabels] = useState<LabelSummary[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<LabelSummary | null>(null);
  const [displayMode, setDisplayMode] = useState<"円" | "pips">("円");

  useEffect(() => {
    async function fetchLabels() {
      try {
        const data = await invoke<LabelSummary[]>("get_all_labels_with_trade");
        console.log("📄 Labels fetched:", data);
        setLabels(data);
      } catch (error) {
        console.error("❌ Failed to fetch labels:", error);
      }
    }

    fetchLabels();
  }, []);

  const formatHoldingTime = (seconds: number): string => {
    const rounded = Math.round(seconds); // 小数点四捨五入
    const min = Math.floor(rounded / 60);
    const sec = rounded % 60;
    return `${min}分${sec}秒`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* ラベル追加ボタン */}
      <div className="flex justify-between items-center mb-3">
        <AddLabelButton
          onAdded={(name) => {
            setLabels((prev) => [...prev, { 
              id: Date.now(), name, profit: 0, profit_pips: 0, count: 0, wins: 0, losses: 0, total_holding_time: 0,trades: [] }]);
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

      <div className="flex space-x-2 mb-2">
        <button
          onClick={() => setDisplayMode("円")}
          className={`px-2 py-1 rounded ${
            displayMode === "円" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          円
        </button>
        <button
          onClick={() => setDisplayMode("pips")}
          className={`px-2 py-1 rounded ${
            displayMode === "pips" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          pips
        </button>
      </div>

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
                    <th className="px-2 py-1 border-b text-center">#</th>
                    <th className="px-2 py-1 border-b text-center">通貨ペア</th>
                    <th className="px-2 py-1 border-b text-center">売買</th>
                    <th className="px-2 py-1 border-b text-right">Lot</th>
                    <th className="px-2 py-1 border-b text-right">Entry Rate</th>
                    <th className="px-2 py-1 border-b text-right">Exit Rate</th>
                    <th className="px-2 py-1 border-b text-right">Entry Time</th>
                    <th className="px-2 py-1 border-b text-right">Exit Time</th>
                    <th className="px-2 py-1 border-b text-right">損益</th>
                </tr>
              </thead>
              <tbody>
                {selectedLabel.trades.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-1 text-center">{t.id}</td>
                    <td className="px-2 py-1 text-center">{t.pair}</td>
                    <td
                      className={`px-2 py-1 text-center font-semibold ${
                        t.side === "買" ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {t.side}
                    </td>
                    <td className="px-2 py-1 text-right">{t.lot}</td>
                    <td className="px-2 py-1 text-right">{t.entry_rate}</td>
                    <td className="px-2 py-1 text-right">{t.exit_rate}</td>
                    <td className="px-2 py-1 text-right">
                      {new Date(t.entry_time * 1000).toLocaleTimeString()}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {new Date(t.exit_time * 1000).toLocaleTimeString()}
                    </td>
                    <td
                      className={`px-2 py-1 text-right font-semibold ${
                        t.profit >= 0 ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {(t.profit > 0 ? "+" : "") +
                      (displayMode == "円" 
                        ? t.profit.toFixed(0)
                        : (t.profit / t.lot / 100).toFixed(1))
                      }
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

          <p>  利益:{" "}
            {displayMode === "円"
              ? selectedLabel?.profit ?? 0
              : (selectedLabel?.profit_pips ?? 0) / 10
            } {displayMode}</p>
          <p>トレード回数: {selectedLabel?.count ?? 0}</p>
          <p>勝ちトレード回数: {selectedLabel?.wins ?? 0}</p>
          <p>負けトレード回数: {selectedLabel?.losses ?? 0}</p>
          <p>
            平均保有時間:{" "}
            {formatHoldingTime(
              (selectedLabel?.total_holding_time ?? 0) /
                (selectedLabel?.count ?? 1)
            )}
          </p>
          <p>
            勝率:{" "}
            {selectedLabel?.count ?? 0 > 0
              ? (
                  ((selectedLabel?.wins ?? 0) /
                    (selectedLabel?.count ?? 1)) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>
    </div>
  );
};

export default LabelManager;
