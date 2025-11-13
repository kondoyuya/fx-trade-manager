import React from "react";

export type DisplayMode = "円" | "pips";

interface DisplayModeToggleProps {
  value: DisplayMode;
  onChange: (val: DisplayMode) => void;
}

export const DisplayModeToggle: React.FC<DisplayModeToggleProps> = ({ value, onChange }) => {
  const options: DisplayMode[] = ["円", "pips"];

  return (
    <div className="flex space-x-2 mb-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-1 rounded ${
            value === opt ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};
