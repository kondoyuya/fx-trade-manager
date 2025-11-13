import React from "react";

type ProfitProps = {
    profit: number;
    className?: string;
    toFix?: number;
};

export const Profit: React.FC<ProfitProps> = ({ profit, className = "px-2 py-1 text-right font-semibold", toFix = 0 }) => {
    const colorClass = profit >= 0 ? "text-blue-600" : "text-red-600";
    const sign = profit > 0 ? "+" : "";

    return (
        <span className={`${colorClass} ${className}`}>
            {sign + profit.toFixed(toFix)}
        </span>
    );
};
