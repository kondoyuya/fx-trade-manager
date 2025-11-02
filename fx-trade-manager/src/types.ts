export interface DailySummary {
  date: string;
  profit: number;
  count: number;
  wins: number;
  losses: number;
  
}

export type Tab = "calendar" | "history" | "settings" | "chart" | "import";
