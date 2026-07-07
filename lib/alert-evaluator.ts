import { computeEma, computeRsi, enrichBars } from "./indicator-engine.js";
import type { AlertRow, EnrichedBar, EvaluationResult, OhlcvBar } from "./types.js";

function emaCross(
  prevFast: number,
  prevSlow: number,
  fast: number,
  slow: number,
  direction: "up" | "down",
): boolean {
  if (direction === "up") return prevFast <= prevSlow && fast > slow;
  return prevFast >= prevSlow && fast < slow;
}

function rsiThreshold(value: number, threshold: number, operator: "<" | ">"): boolean {
  return operator === "<" ? value < threshold : value > threshold;
}

function evaluateCustom(
  params: Record<string, unknown>,
  enriched: EnrichedBar[],
): boolean {
  const current = enriched.at(-1)!;
  const previous = enriched.at(-2)!;
  const type = params.type;

  if (type === "ema") {
    const fastLen = Number(params.ema_fast);
    const slowLen = Number(params.ema_slow);
    const direction = params.direction as "up" | "down";
    const closes = enriched.map((b) => b.close);
    const fastKey = `ema_${fastLen}` as keyof EnrichedBar;
    const slowKey = `ema_${slowLen}` as keyof EnrichedBar;
    let fastSeries = enriched.map((b) => b[fastKey] as number | undefined);
    let slowSeries = enriched.map((b) => b[slowKey] as number | undefined);
    if (fastSeries.some((v) => v === undefined)) {
      fastSeries = computeEma(closes, fastLen);
    }
    if (slowSeries.some((v) => v === undefined)) {
      slowSeries = computeEma(closes, slowLen);
    }
    return emaCross(
      fastSeries.at(-2)!,
      slowSeries.at(-2)!,
      fastSeries.at(-1)!,
      slowSeries.at(-1)!,
      direction,
    );
  }

  if (type === "rsi") {
    const period = Number(params.period ?? 14);
    const rsiKey = `rsi_${period}` as keyof EnrichedBar;
    let rsiVal = current[rsiKey] as number | undefined;
    if (rsiVal === undefined) {
      rsiVal = computeRsi(enriched.map((b) => b.close), period).at(-1)!;
    }
    return rsiThreshold(
      rsiVal,
      Number(params.threshold),
      params.operator as "<" | ">",
    );
  }

  throw new Error("Alerta custom sin tipo válido (ema o rsi).");
}

function evaluatePreset(
  preset: string,
  params: Record<string, unknown>,
  current: EnrichedBar,
  previous: EnrichedBar,
  enriched: EnrichedBar[],
): boolean {
  switch (preset) {
    case "ema_cross_bull":
      return emaCross(previous.ema_9!, previous.ema_21!, current.ema_9!, current.ema_21!, "up");
    case "ema_cross_bear":
      return emaCross(previous.ema_9!, previous.ema_21!, current.ema_9!, current.ema_21!, "down");
    case "golden_cross":
      return emaCross(previous.ema_50!, previous.ema_200!, current.ema_50!, current.ema_200!, "up");
    case "death_cross":
      return emaCross(previous.ema_50!, previous.ema_200!, current.ema_50!, current.ema_200!, "down");
    case "rsi_oversold":
      return rsiThreshold(current.rsi_14!, 30, "<");
    case "rsi_overbought":
      return rsiThreshold(current.rsi_14!, 70, ">");
    case "custom":
      return evaluateCustom(params, enriched);
    default:
      throw new Error(`Preset no soportado: ${preset}`);
  }
}

export function evaluateAlert(alert: Pick<AlertRow, "ticker" | "preset_or_custom" | "params">, bars: OhlcvBar[]): EvaluationResult {
  if (bars.length < 2) {
    throw new Error("Se necesitan al menos 2 velas para evaluar una alerta.");
  }
  const enriched = enrichBars(bars);
  const current = enriched.at(-1)!;
  const previous = enriched.at(-2)!;
  const conditionMet = evaluatePreset(
    alert.preset_or_custom,
    alert.params ?? {},
    current,
    previous,
    enriched,
  );

  return {
    conditionMet,
    candleTimestamp: current.datetime,
    presetOrCustom: alert.preset_or_custom,
    ticker: alert.ticker,
  };
}
