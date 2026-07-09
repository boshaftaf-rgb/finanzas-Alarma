import { describe, expect, it } from "vitest";
import { evaluateAlert } from "../lib/alert-evaluator.js";
import { formatAlertLabel, formatCustomLabel } from "../lib/alert-labels.js";
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

describe("alert-labels", () => {
  it("formatea etiqueta EMA custom", () => {
    expect(
      formatCustomLabel({ type: "ema", ema_fast: 12, ema_slow: 26, direction: "up" }),
    ).toBe("Cruce personalizado EMA 12/26 al alza");
  });

  it("formatea etiqueta precio vs MA custom", () => {
    expect(
      formatCustomLabel({ type: "price_ma", ma_type: "sma", period: 12, direction: "up" }),
    ).toBe("Precio cruza SMA(12) al alza");
  });

  it("formatea etiqueta RSI custom", () => {
    expect(
      formatCustomLabel({ type: "rsi", period: 10, threshold: 25, operator: "<" }),
    ).toBe("RSI(10) < 25");
  });

  it("formatAlertLabel usa preset o custom", () => {
    expect(formatAlertLabel("ema_cross_bull")).toBe("Impulso alcista corto");
    expect(
      formatAlertLabel("custom", { type: "rsi", period: 10, threshold: 25, operator: "<" }),
    ).toBe("RSI(10) < 25");
    expect(formatAlertLabel("rsi_oversold", { period: 10, threshold: 25 })).toBe(
      "Sobreventa — RSI(10) < 25",
    );
    expect(formatAlertLabel("rsi_overbought")).toBe("Sobrecompra — RSI(14) > 70");
    expect(
      formatAlertLabel("custom", { type: "price_ma", ma_type: "sma", period: 12, direction: "up" }, "1day"),
    ).toBe("Precio cruza SMA(12) al alza · Diario");
  });
});

describe("alert-evaluator custom", () => {
  it("evalúa custom RSI(10) < 25", () => {
    let price = 200;
    const closes = [price];
    for (let i = 0; i < 60; i++) {
      price *= 0.975;
      closes.push(price);
    }
    const result = evaluateAlert(
      {
        ticker: "TEST",
        preset_or_custom: "custom",
        params: { type: "rsi", period: 10, threshold: 25, operator: "<" },
      },
      barsFromCloses(closes),
    );
    expect(result.conditionMet).toBe(true);
  });

  it("evalúa custom precio cruza SMA(12) al alza", () => {
    const closes = [...Array(16).fill(100), 110];

    const result = evaluateAlert(
      {
        ticker: "TEST",
        preset_or_custom: "custom",
        params: { type: "price_ma", ma_type: "sma", period: 12, direction: "up" },
      },
      barsFromCloses(closes),
    );
    expect(result.conditionMet).toBe(true);
  });
});
