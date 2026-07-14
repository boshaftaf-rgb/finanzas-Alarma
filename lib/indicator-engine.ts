import type { EnrichedBar, OhlcvBar } from "./types.js";

const REQUIRED = ["open", "high", "low", "close", "volume"] as const;

export function validateOhlcv(bars: OhlcvBar[]): void {
  if (bars.length === 0) {
    throw new Error("El array OHLCV está vacío.");
  }
  for (const bar of bars) {
    for (const key of REQUIRED) {
      if (typeof bar[key] !== "number") {
        throw new Error(`Falta columna OHLCV: ${key}`);
      }
    }
  }
}

export function computeEma(closes: number[], length: number): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (length + 1);
  const result: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    result.push(closes[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function computeSma(closes: number[], length: number): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < length || length < 1) return result;

  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += closes[i];
  }
  result[length - 1] = sum / length;

  for (let i = length; i < closes.length; i++) {
    sum += closes[i] - closes[i - length];
    result[i] = sum / length;
  }
  return result;
}

export function computeRsi(closes: number[], length = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= length) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= length; i++) {
    const delta = closes[i] - closes[i - 1];
    avgGain += Math.max(delta, 0);
    avgLoss += Math.max(-delta, 0);
  }
  avgGain /= length;
  avgLoss /= length;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result[length] = 100 - 100 / (1 + rs0);

  for (let i = length + 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    avgGain = (avgGain * (length - 1) + gain) / length;
    avgLoss = (avgLoss * (length - 1) + loss) / length;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs);
  }
  return result;
}

/** Fast Stochastic %K over the last `length` bars. Range 0 = 50. */
export function computeStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  length: number,
): number[] {
  const n = closes.length;
  const result: number[] = new Array(n).fill(NaN);
  if (highs.length !== n || lows.length !== n || length < 1 || n < length) {
    return result;
  }

  for (let i = length - 1; i < n; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - length + 1; j <= i; j++) {
      if (highs[j] > highest) highest = highs[j];
      if (lows[j] < lowest) lowest = lows[j];
    }
    const range = highest - lowest;
    result[i] = range === 0 ? 50 : (100 * (closes[i] - lowest)) / range;
  }
  return result;
}

export function enrichBars(bars: OhlcvBar[]): EnrichedBar[] {
  validateOhlcv(bars);
  const closes = bars.map((b) => b.close);
  const ema9 = computeEma(closes, 9);
  const ema21 = computeEma(closes, 21);
  const ema50 = computeEma(closes, 50);
  const ema200 = computeEma(closes, 200);
  const rsi14 = computeRsi(closes, 14);

  return bars.map((bar, i) => ({
    ...bar,
    ema_9: ema9[i],
    ema_21: ema21[i],
    ema_50: ema50[i],
    ema_200: ema200[i],
    rsi_14: rsi14[i],
  }));
}
