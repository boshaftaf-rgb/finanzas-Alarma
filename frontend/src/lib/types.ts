export type PresetId =
  | "ema_cross_bull"
  | "ema_cross_bear"
  | "golden_cross"
  | "death_cross"
  | "rsi_oversold"
  | "rsi_overbought";

export interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  preset_or_custom: PresetId | "custom";
  params: Record<string, unknown>;
  active: boolean;
  emails_sent_today: number;
  email_count_date: string | null;
  last_triggered_candle: string | null;
  last_evaluated_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAlertInput {
  ticker: string;
  preset: PresetId;
}
