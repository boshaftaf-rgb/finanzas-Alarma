import { formatAlertLabel, presetLabel } from "./alert-labels.js";
import { timeframeLabel } from "./types.js";

export { presetLabel };

export function formatCandleForEmail(candleTimestamp: string, timeframe?: string | null): string {
  const date = new Date(candleTimestamp);
  const isDaily = timeframe === "1day";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    ...(isDaily ? {} : { timeStyle: "short" }),
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
  timeframe?: string | null;
}): AlertEmailContent {
  const label = formatAlertLabel(params.presetOrCustom, params.alertParams ?? {}, params.timeframe);
  const vela = formatCandleForEmail(params.candleTimestamp, params.timeframe);
  const tfLabel = timeframeLabel(params.timeframe);

  const subject = `Alerta ${params.ticker}: ${label}`;
  const text = [
    "Stock Alerts — notificación de alerta",
    "",
    `Ticker: ${params.ticker}`,
    `Tipo de alerta: ${label}`,
    `Timeframe: ${tfLabel}`,
    `Vela: ${vela} (hora del mercado EE. UU.)`,
    "",
    "La condición configurada se cumplió en la vela más reciente.",
    "",
    "—",
    "Este mensaje es informativo, no es recomendación de inversión.",
  ].join("\n");

  return { subject, text };
}
