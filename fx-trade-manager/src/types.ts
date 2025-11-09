export interface DailySummary {
  date: string;
  profit: number;
  count: number;
  wins: number;
  losses: number;
  total_holding_time: number;
  trades: Trade[];
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

export type Tab = "calendar" | "history" | "statistics" | "chart" | "import";
