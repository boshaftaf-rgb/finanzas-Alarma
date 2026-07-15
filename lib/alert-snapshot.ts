import { evaluateAlert } from "./alert-evaluator.js";
import {
  computeEma,
  computeRsi,
  computeSma,
  computeStochastic,
  enrichBars,
} from "./indicator-engine.js";
import type { AlertRow, EnrichedBar, OhlcvBar } from "./types.js";

export interface AlertSnapshot {
  ticker: string;
  presetOrCustom: string;
  timeframe?: string | null;
  alertParams: Record<string, unknown>;
  conditionMet: boolean;
  candleTimestamp: string;
  close: number;
  valueLines: string[];
}

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "n/d";
  return n.toFixed(digits);
}

function resolveRsi(
  current: EnrichedBar,
  enriched: EnrichedBar[],
  period: number,
): number {
  const key = `rsi_${period}` as keyof EnrichedBar;
  const cached = current[key] as number | undefined;
  if (cached !== undefined && Number.isFinite(cached)) return cached;
  return computeRsi(
    enriched.map((b) => b.close),
    period,
  ).at(-1)!;
}

function resolveStoch(enriched: EnrichedBar[], period: number): number {
  return computeStochastic(
    enriched.map((b) => b.high),
    enriched.map((b) => b.low),
    enriched.map((b) => b.close),
    period,
  ).at(-1)!;
}

function resolveEma(
  enriched: EnrichedBar[],
  current: EnrichedBar,
  length: number,
): number {
  const key = `ema_${length}` as keyof EnrichedBar;
  const cached = current[key] as number | undefined;
  if (cached !== undefined && Number.isFinite(cached)) return cached;
  return computeEma(
    enriched.map((b) => b.close),
    length,
  ).at(-1)!;
}

function indicatorLines(
  preset: string,
  params: Record<string, unknown>,
  current: EnrichedBar,
  enriched: EnrichedBar[],
): string[] {
  if (
    preset === "ema_cross_bull" ||
    preset === "ema_cross_bear"
  ) {
    return [
      `EMA(9): ${fmt(current.ema_9!)}`,
      `EMA(21): ${fmt(current.ema_21!)}`,
    ];
  }

  if (preset === "golden_cross" || preset === "death_cross") {
    return [
      `EMA(50): ${fmt(current.ema_50!)}`,
      `EMA(200): ${fmt(current.ema_200!)}`,
    ];
  }

  if (preset === "rsi_oversold" || preset === "rsi_overbought") {
    const period = Number(params.period ?? 14);
    return [`RSI(${period}): ${fmt(resolveRsi(current, enriched, period), 1)}`];
  }

  if (preset === "stoch_oversold" || preset === "stoch_overbought") {
    const period = Number(params.period ?? 7);
    return [`Stoch %K(${period}): ${fmt(resolveStoch(enriched, period), 1)}`];
  }

  if (preset === "custom") {
    const type = params.type;

    if (type === "ema") {
      const fast = Number(params.ema_fast);
      const slow = Number(params.ema_slow);
      return [
        `EMA(${fast}): ${fmt(resolveEma(enriched, current, fast))}`,
        `EMA(${slow}): ${fmt(resolveEma(enriched, current, slow))}`,
      ];
    }

    if (type === "price_ma") {
      const period = Number(params.period);
      const closes = enriched.map((b) => b.close);
      const ma =
        params.ma_type === "ema"
          ? computeEma(closes, period).at(-1)!
          : computeSma(closes, period).at(-1)!;
      const maName = params.ma_type === "ema" ? "EMA" : "SMA";
      return [`${maName}(${period}): ${fmt(ma)}`];
    }

    if (type === "rsi") {
      const period = Number(params.period ?? 14);
      return [`RSI(${period}): ${fmt(resolveRsi(current, enriched, period), 1)}`];
    }

    if (type === "stochastic") {
      const period = Number(params.period ?? 7);
      return [`Stoch %K(${period}): ${fmt(resolveStoch(enriched, period), 1)}`];
    }

    if (type === "price_level") {
      return [`Nivel: ${fmt(Number(params.level))}`];
    }

    if (type === "price_range") {
      return [
        `Rango bajo: ${fmt(Number(params.low))}`,
        `Rango alto: ${fmt(Number(params.high))}`,
      ];
    }
  }

  return [];
}

/** Valores actuales de la alerta (datos reales); no modifica la lógica de disparo. */
export function buildAlertSnapshot(
  alert: Pick<AlertRow, "ticker" | "preset_or_custom" | "params" | "timeframe">,
  bars: OhlcvBar[],
): AlertSnapshot {
  const evaluation = evaluateAlert(alert, bars);
  const enriched = enrichBars(bars);
  const current = enriched.at(-1)!;
  const params = alert.params ?? {};

  return {
    ticker: alert.ticker,
    presetOrCustom: alert.preset_or_custom,
    timeframe: alert.timeframe,
    alertParams: params,
    conditionMet: evaluation.conditionMet,
    candleTimestamp: evaluation.candleTimestamp,
    close: current.close,
    valueLines: indicatorLines(alert.preset_or_custom, params, current, enriched),
  };
}
