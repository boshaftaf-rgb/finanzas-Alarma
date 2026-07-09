import { describe, expect, it } from "vitest";
import { evaluateAlert } from "../lib/alert-evaluator.js";
import { computeEma, computeSma, enrichBars } from "../lib/indicator-engine.js";
import type { OhlcvBar } from "../lib/types.js";

function barsFromCloses(closes: number[]): OhlcvBar[] {
  return closes.map((close, i) => ({
    datetime: new Date(Date.UTC(2026, 2, 2, 14, 30 + 15 * i)).toISOString(),
    open: close - 0.2,
    high: close + 0.3,
    low: close - 0.4,
    close,
    volume: 100_000,
  }));
}

describe("indicator-engine", () => {
  it("calcula EMA consistente con ewm", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
    const ema9 = computeEma(closes, 9);
    expect(ema9.at(-1)).toBeTypeOf("number");
    const enriched = enrichBars(barsFromCloses(closes));
    expect(enriched[0].ema_9).toBeDefined();
    expect(enriched[0].rsi_14).toBeDefined();
  });

  it("calcula SMA con warmup en índice length-1", () => {
    const closes = [10, 11, 12, 13, 14];
    const sma3 = computeSma(closes, 3);
    expect(sma3[1]).toBeNaN();
    expect(sma3[2]).toBeCloseTo(11);
    expect(sma3[4]).toBeCloseTo(13);
  });
});

describe("alert-evaluator", () => {
  it("detecta cruce alcista EMA 9/21", () => {
    const base = Array.from({ length: 50 }, (_, i) => 150 - i * 0.8);
    let closes = base;
    for (let jump = 50; jump < 120; jump++) {
      closes = [...base, base.at(-1)! + jump];
      const result = evaluateAlert(
        { ticker: "TEST", preset_or_custom: "ema_cross_bull", params: {} },
        barsFromCloses(closes),
      );
      if (result.conditionMet) {
        expect(result.conditionMet).toBe(true);
        return;
      }
    }
    throw new Error("No se generó cruce alcista en el test");
  });

  it("detecta RSI sobreventa", () => {
    let price = 200;
    const closes = [price];
    for (let i = 0; i < 60; i++) {
      price *= 0.975;
      closes.push(price);
    }
    const result = evaluateAlert(
      { ticker: "TEST", preset_or_custom: "rsi_oversold", params: {} },
      barsFromCloses(closes),
    );
    expect(result.conditionMet).toBe(true);
  });

  it("detecta RSI sobreventa con params personalizados", () => {
    let price = 200;
    const closes = [price];
    for (let i = 0; i < 60; i++) {
      price *= 0.975;
      closes.push(price);
    }
    const resultDefault = evaluateAlert(
      { ticker: "TEST", preset_or_custom: "rsi_oversold", params: {} },
      barsFromCloses(closes),
    );
    const resultCustom = evaluateAlert(
      { ticker: "TEST", preset_or_custom: "rsi_oversold", params: { period: 10, threshold: 25 } },
      barsFromCloses(closes),
    );
    expect(resultDefault.conditionMet).toBe(true);
    expect(resultCustom.conditionMet).toBe(true);
  });
});
