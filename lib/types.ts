export interface OhlcvBar {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AlertTimeframe = "15min" | "1day";

export function normalizeTimeframe(timeframe?: string | null): AlertTimeframe {
  return timeframe === "1day" ? "1day" : "15min";
}

export function timeframeLabel(timeframe?: string | null): string {
  return normalizeTimeframe(timeframe) === "1day" ? "Diario" : "15 minutos";
}

export interface AlertRow {
  id: string;
  user_id: string;
  ticker: string;
  preset_or_custom: string;
  params: Record<string, unknown>;
  timeframe?: AlertTimeframe | string | null;
  active: boolean;
  emails_sent_today: number;
  email_count_date: string | null;
  last_triggered_candle: string | null;
  last_evaluated_at: string | null;
}

export interface AlertFiringInsert {
  user_id: string;
  alert_id: string;
  ticker: string;
  preset_or_custom: string;
  params: Record<string, unknown>;
  timeframe: AlertTimeframe;
  candle_timestamp: string;
  label: string;
  sent_at?: string;
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
