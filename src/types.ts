export interface DailySummary {
  date: string
  summary: TradeSummary
}

export interface Trade {
  id: number
  pair: string
  side: string
  lot: number
  entry_rate: number
  exit_rate: number
  entry_time: number
  exit_time: number
  profit: number
  profit_pips: number
  swap: number
  memo: string
}

export interface TradeSummary {
  trades: Trade[] // トレード一覧

  profit: number // 総利益
  profit_pips: number // 総pips
  count: number // トレード回数
  wins: number // 勝ちトレード回数
  losses: number // 負けトレード回数

  win_total: number // 勝ちトレード総額
  loss_total: number // 負けトレード総額
  win_pips_total: number // 勝ちトレード総額
  loss_pips_total: number // 負けトレード総額

  avg_profit_wins: number // 勝ちトレード平均額
  avg_profit_losses: number // 負けトレード平均額
  avg_profit_pips_wins: number // 勝ちトレード平均pips
  avg_profit_pips_losses: number // 負けトレード平均pips

  avg_holding_time: number // 平均保有時間（秒など）
  avg_holding_time_wins: number // 勝ちトレード平均保有時間
  avg_holding_time_losses: number // 負けトレード平均保有時間
}

export type Tab =
  | 'calendar'
  | 'history'
  | 'statistics'
  | 'chart'
  | 'import'
  | 'profit'
