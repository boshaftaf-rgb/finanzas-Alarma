import { formatAlertLabel, presetLabel } from "./alert-labels.js";
import { timeframeLabel } from "./types.js";

export { presetLabel };

export function formatCandleForEmail(candleTimestamp: string, timeframe?: string | null): string {
  const date = new Date(candleTimestamp);
  const isDaily = timeframe === "1day";
  // Daily bars from Twelve Data are calendar trading dates stored as UTC midnight
  // (e.g. 2026-07-29T00:00:00.000Z). Formatting that instant in America/New_York
  // falls on the previous calendar day during EDT/EST — use UTC for daily labels.
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: isDaily ? "UTC" : "America/New_York",
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
  close?: number;
  valueLines?: string[];
}): AlertEmailContent {
  const label = formatAlertLabel(params.presetOrCustom, params.alertParams ?? {}, params.timeframe);
  const vela = formatCandleForEmail(params.candleTimestamp, params.timeframe);
  const tfLabel = timeframeLabel(params.timeframe);
  const closeStr =
    params.close !== undefined && Number.isFinite(params.close)
      ? params.close.toFixed(2)
      : null;
  const valueLines = params.valueLines ?? [];

  const subject = `Alerta ${params.ticker}: ${label}`;
  const text = [
    "Stock Alerts — notificación de alerta",
    "",
    `Ticker: ${params.ticker}`,
    `Tipo de alerta: ${label}`,
    `Timeframe: ${tfLabel}`,
    `Vela: ${vela} (hora del mercado EE. UU.)`,
    ...(closeStr !== null ? [`Cierre: ${closeStr}`] : []),
    ...valueLines,
    "",
    "La condición configurada se cumplió en la vela más reciente.",
    "",
    "—",
    "Este mensaje es informativo, no es recomendación de inversión.",
  ].join("\n");

  return { subject, text };
}

export function buildVerifyAlertEmail(params: {
  ticker: string;
  presetOrCustom: string;
  candleTimestamp: string;
  alertParams?: Record<string, unknown>;
  timeframe?: string | null;
  close: number;
  valueLines: string[];
  conditionMet: boolean;
}): AlertEmailContent {
  const label = formatAlertLabel(params.presetOrCustom, params.alertParams ?? {}, params.timeframe);
  const vela = formatCandleForEmail(params.candleTimestamp, params.timeframe);
  const tfLabel = timeframeLabel(params.timeframe);
  const closeStr = Number.isFinite(params.close) ? params.close.toFixed(2) : "n/d";

  const subject = `Verificación ${params.ticker}: ${label}`;
  const text = [
    "Stock Alerts — verificación manual",
    "",
    `Ticker: ${params.ticker}`,
    `Tipo de alerta: ${label}`,
    `Timeframe: ${tfLabel}`,
    `Vela: ${vela} (hora del mercado EE. UU.)`,
    `Cierre: ${closeStr}`,
    ...params.valueLines,
    `Cumple condición: ${params.conditionMet ? "sí" : "no"}`,
    "",
    "Compara estos valores con tu gráfico. Este mensaje no es un disparo de alerta.",
    "",
    "—",
    "Este mensaje es informativo, no es recomendación de inversión.",
  ].join("\n");

  return { subject, text };
}
