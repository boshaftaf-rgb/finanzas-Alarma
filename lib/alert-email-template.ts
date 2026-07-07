const PRESET_LABELS: Record<string, string> = {
  ema_cross_bull: "Cruce alcista rápido (EMA 9/21)",
  ema_cross_bear: "Cruce bajista rápido (EMA 9/21)",
  golden_cross: "Golden Cross (EMA 50/200)",
  death_cross: "Death Cross (EMA 50/200)",
  rsi_oversold: "RSI sobreventa (< 30)",
  rsi_overbought: "RSI sobrecompra (> 70)",
  custom: "Alerta personalizada",
};

export function presetLabel(presetOrCustom: string): string {
  return PRESET_LABELS[presetOrCustom] ?? presetOrCustom;
}

export function formatCandleForEmail(candleTimestamp: string): string {
  const date = new Date(candleTimestamp);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export interface AlertEmailContent {
  subject: string;
  text: string;
}

export function buildAlertEmail(params: {
  ticker: string;
  presetOrCustom: string;
  candleTimestamp: string;
}): AlertEmailContent {
  const label = presetLabel(params.presetOrCustom);
  const vela = formatCandleForEmail(params.candleTimestamp);

  const subject = `Alerta ${params.ticker}: ${label}`;
  const text = [
    "Stock Alerts — notificación de alerta",
    "",
    `Ticker: ${params.ticker}`,
    `Tipo de alerta: ${label}`,
    `Timeframe: 15 minutos`,
    `Vela: ${vela} (hora del mercado EE. UU.)`,
    "",
    "La condición configurada se cumplió en la vela más reciente.",
    "",
    "—",
    "Este mensaje es informativo, no es recomendación de inversión.",
  ].join("\n");

  return { subject, text };
}
