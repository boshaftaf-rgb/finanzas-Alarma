import { todayMarketDate } from "./alert-fire-policy.js";
import { isDailySessionClosed } from "./market-scheduler.js";
import type { AlertTimeframe, OhlcvBar } from "./types.js";
import { normalizeTimeframe } from "./types.js";

/** Fecha calendario de una vela diaria Twelve Data (`YYYY-MM-DD` en UTC midnight). */
export function barCalendarDate(bar: Pick<OhlcvBar, "datetime">): string {
  return bar.datetime.slice(0, 10);
}

/**
 * Para alertas `1day`: si la última vela es la sesión de hoy y el mercado
 * aún no cerró (≥16:00 ET), se descarta — evita disparar sobre una vela incompleta.
 * Intradía (`15min`) no se filtra.
 */
export function selectBarsForEvaluation(
  bars: OhlcvBar[],
  timeframe?: string | null,
  now = new Date(),
): OhlcvBar[] {
  if (normalizeTimeframe(timeframe) !== "1day" || bars.length === 0) {
    return bars;
  }

  const last = bars.at(-1)!;
  const today = todayMarketDate(now);
  if (barCalendarDate(last) === today && !isDailySessionClosed(now)) {
    return bars.slice(0, -1);
  }
  return bars;
}

export function assertBarsForEvaluation(
  bars: OhlcvBar[],
  timeframe: AlertTimeframe | string | null | undefined,
  now = new Date(),
): OhlcvBar[] {
  const usable = selectBarsForEvaluation(bars, timeframe, now);
  if (usable.length < 2) {
    throw new Error(
      "Se necesitan al menos 2 velas para evaluar la alerta.",
    );
  }
  return usable;
}
