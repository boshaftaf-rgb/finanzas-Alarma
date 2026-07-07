import { formatAlertLabel, presetLabel } from "./alert-labels.js";

export { presetLabel };

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
  alertParams?: Record<string, unknown>;
}): AlertEmailContent {
  const label = formatAlertLabel(params.presetOrCustom, params.alertParams ?? {});
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
