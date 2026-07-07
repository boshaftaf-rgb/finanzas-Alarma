import type { AlertRow } from "./types.js";

export function todayMarketDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

export function effectiveDailyCount(
  alert: Pick<AlertRow, "emails_sent_today" | "email_count_date">,
  today: string,
): number {
  if (!alert.email_count_date || alert.email_count_date < today) {
    return 0;
  }
  return alert.emails_sent_today;
}

export type FireBlockReason = "condicion_no_cumplida" | "candle_lock" | "limite_diario";

export interface FireDecision {
  shouldSend: boolean;
  reason?: FireBlockReason;
}

export function decideFire(
  conditionMet: boolean,
  alert: Pick<AlertRow, "last_triggered_candle" | "emails_sent_today" | "email_count_date">,
  candleTimestamp: string,
  today: string,
): FireDecision {
  if (!conditionMet) {
    return { shouldSend: false, reason: "condicion_no_cumplida" };
  }

  const dailyCount = effectiveDailyCount(alert, today);
  if (dailyCount >= 10) {
    return { shouldSend: false, reason: "limite_diario" };
  }

  if (alert.last_triggered_candle) {
    const candleMs = new Date(candleTimestamp).getTime();
    const lastMs = new Date(alert.last_triggered_candle).getTime();
    if (candleMs <= lastMs) {
      return { shouldSend: false, reason: "candle_lock" };
    }
  }

  return { shouldSend: true };
}

export function formatOutcome(decision: FireDecision, emailSent: boolean): string {
  if (emailSent) return "EMAIL ENVIADO";
  if (!decision.shouldSend && decision.reason === "condicion_no_cumplida") {
    return "NO DISPARARÍA";
  }
  if (decision.reason === "candle_lock") return "BLOQUEADO (candle-lock)";
  if (decision.reason === "limite_diario") return "BLOQUEADO (límite diario)";
  return "DISPARARÍA";
}
