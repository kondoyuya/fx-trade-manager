import React from "react";

interface ProfitEditorProps {
  date: Date;
  value: number | "";
  setValue: (val: number | "") => void;
  onSave: () => void;
  onCancel: () => void;
}

const ProfitEditor: React.FC<ProfitEditorProps> = ({ date, value, setValue, onSave, onCancel }) => {
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow-md w-80">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        {formatDate(date)} の収支を入力
      </h2>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
        placeholder="例: 500 または -300"
      />
      <div className="flex justify-between">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          キャンセル
        </button>
        <button onClick={onSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          保存
        </button>
      </div>
    </div>
  );
};

export default ProfitEditor;
