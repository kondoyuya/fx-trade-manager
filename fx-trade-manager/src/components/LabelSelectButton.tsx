import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Label {
    id: number;
    name: string;
}

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

interface LabelSelectPopupProps {
    trade: Trade | null;
    labels: Label[];
    onClose: () => void;
}

export const LabelSelectPopup: React.FC<LabelSelectPopupProps> = ({
    trade,
    labels,
    onClose,
}) => {
    const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    function toggleLabelSelection(labelId: number) {
        setSelectedLabelIds((prev) =>
            prev.includes(labelId)
                ? prev.filter((id) => id !== labelId)
                : [...prev, labelId]
        );
    }

    async function handleRegister() {
        console.log("selectedTrade:", trade);
        console.log("selectedLabel:", selectedLabelIds);
        if (!trade || selectedLabelIds.length === 0) return;

        setLoading(true);
        try {
            for (const labelId of selectedLabelIds) {
                await invoke("add_trade_label", {
                    tradeId: trade.id,
                    labelId,
                });
            }
            onClose();
        } catch (error) {
            console.error("❌ Failed to register labels:", error);
            alert("ラベル登録に失敗しました。");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <h2 className="text-lg font-bold mb-3">ラベルを登録</h2>
                <p className="text-sm text-gray-500 mb-3">トレードID: {trade?.id}</p>

                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                    {labels.length > 0 ? (
                        labels.map((label) => (
                            <div
                                key={label.id}
                                className={`p-2 rounded cursor-pointer ${
                                    selectedLabelIds.includes(label.id)
                                        ? "bg-blue-500 text-white"
                                        : "hover:bg-gray-100"
                                }`}
                                onClick={() => toggleLabelSelection(label.id)}
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
                        onClick={onClose}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleRegister}
                        disabled={selectedLabelIds.length === 0 || loading}
                        className={`px-3 py-1 rounded text-white ${
                            selectedLabelIds.length === 0 || loading
                                ? "bg-blue-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading
                            ? "登録中..."
                            : `登録（${selectedLabelIds.length}件）`}
                    </button>
                </div>
            </div>
        </div>
    );
};
