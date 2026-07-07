export interface OhlcvBar {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AlertRow {
  id: string;
  user_id: string;
  ticker: string;
  preset_or_custom: string;
  params: Record<string, unknown>;
  active: boolean;
  emails_sent_today: number;
  email_count_date: string | null;
  last_triggered_candle: string | null;
  last_evaluated_at: string | null;
}

export interface EvaluationResult {
  conditionMet: boolean;
  candleTimestamp: string;
  presetOrCustom: string;
  ticker: string;
}

export interface EnrichedBar extends OhlcvBar {
  ema_9?: number;
  ema_21?: number;
  ema_50?: number;
  ema_200?: number;
  rsi_14?: number;
  [key: string]: string | number | undefined;
}
