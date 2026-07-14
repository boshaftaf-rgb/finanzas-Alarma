import { computeEma, computeRsi, computeSma, computeStochastic, enrichBars } from "./indicator-engine.js";
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

function priceMaCross(
  prevClose: number,
  prevMa: number,
  close: number,
  ma: number,
  direction: "up" | "down",
): boolean {
  if (direction === "up") return prevClose <= prevMa && close > ma;
  return prevClose >= prevMa && close < ma;
}

function rsiThreshold(value: number, threshold: number, operator: "<" | ">"): boolean {
  return operator === "<" ? value < threshold : value > threshold;
}

function priceLevelCross(
  prevClose: number,
  close: number,
  level: number,
  operator: ">=" | "<=",
): boolean {
  if (operator === ">=") return prevClose < level && close >= level;
  return prevClose > level && close <= level;
}

function priceRangeBreakout(
  prevClose: number,
  close: number,
  low: number,
  high: number,
): boolean {
  const brokeUp = priceLevelCross(prevClose, close, high, ">=");
  const brokeDown = priceLevelCross(prevClose, close, low, "<=");
  return brokeUp || brokeDown;
}

function resolveRsiValue(
  current: EnrichedBar,
  enriched: EnrichedBar[],
  period: number,
): number {
  const rsiKey = `rsi_${period}` as keyof EnrichedBar;
  let rsiVal = current[rsiKey] as number | undefined;
  if (rsiVal === undefined) {
    rsiVal = computeRsi(enriched.map((b) => b.close), period).at(-1)!;
  }
  return rsiVal;
}

function resolveStochasticValue(enriched: EnrichedBar[], period: number): number {
  const stoch = computeStochastic(
    enriched.map((b) => b.high),
    enriched.map((b) => b.low),
    enriched.map((b) => b.close),
    period,
  );
  return stoch.at(-1)!;
}

function evaluateRsiPreset(
  preset: "rsi_oversold" | "rsi_overbought",
  params: Record<string, unknown>,
  current: EnrichedBar,
  enriched: EnrichedBar[],
): boolean {
  const period = Number(params.period ?? 14);
  const defaultThreshold = preset === "rsi_oversold" ? 30 : 70;
  const threshold = Number(params.threshold ?? defaultThreshold);
  const operator = preset === "rsi_oversold" ? "<" : ">";
  const rsiVal = resolveRsiValue(current, enriched, period);
  return rsiThreshold(rsiVal, threshold, operator);
}

function evaluateStochPreset(
  preset: "stoch_oversold" | "stoch_overbought",
  params: Record<string, unknown>,
  enriched: EnrichedBar[],
): boolean {
  const period = Number(params.period ?? 7);
  const defaultThreshold = preset === "stoch_oversold" ? 20 : 80;
  const threshold = Number(params.threshold ?? defaultThreshold);
  const operator = preset === "stoch_oversold" ? "<" : ">";
  const stochVal = resolveStochasticValue(enriched, period);
  if (!Number.isFinite(stochVal)) return false;
  return rsiThreshold(stochVal, threshold, operator);
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

  if (type === "price_ma") {
    const period = Number(params.period);
    const direction = params.direction as "up" | "down";
    const closes = enriched.map((b) => b.close);
    const maSeries =
      params.ma_type === "ema" ? computeEma(closes, period) : computeSma(closes, period);
    const i = closes.length - 1;
    const prevI = i - 1;
    const ma = maSeries[i];
    const prevMa = maSeries[prevI];
    if (!Number.isFinite(ma) || !Number.isFinite(prevMa)) {
      return false;
    }
    return priceMaCross(closes[prevI], prevMa, closes[i], ma, direction);
  }

  if (type === "rsi") {
    const period = Number(params.period ?? 14);
    const rsiVal = resolveRsiValue(current, enriched, period);
    return rsiThreshold(
      rsiVal,
      Number(params.threshold),
      params.operator as "<" | ">",
    );
  }

  if (type === "stochastic") {
    const period = Number(params.period ?? 7);
    const stochVal = resolveStochasticValue(enriched, period);
    if (!Number.isFinite(stochVal)) return false;
    return rsiThreshold(
      stochVal,
      Number(params.threshold),
      params.operator as "<" | ">",
    );
  }

  if (type === "price_level") {
    const level = Number(params.level);
    const operator = params.operator as ">=" | "<=";
    if (!Number.isFinite(level) || level <= 0) {
      return false;
    }
    return priceLevelCross(previous.close, current.close, level, operator);
  }

  if (type === "price_range") {
    const low = Number(params.low);
    const high = Number(params.high);
    if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high <= 0 || low >= high) {
      return false;
    }
    return priceRangeBreakout(previous.close, current.close, low, high);
  }

  throw new Error(
    "Alerta custom sin tipo válido (ema, price_ma, rsi, stochastic, price_level o price_range).",
  );
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
      return evaluateRsiPreset("rsi_oversold", params, current, enriched);
    case "rsi_overbought":
      return evaluateRsiPreset("rsi_overbought", params, current, enriched);
    case "stoch_oversold":
      return evaluateStochPreset("stoch_oversold", params, enriched);
    case "stoch_overbought":
      return evaluateStochPreset("stoch_overbought", params, enriched);
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
