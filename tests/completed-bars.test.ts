import { describe, expect, it } from "vitest";
import {
  assertBarsForEvaluation,
  selectBarsForEvaluation,
} from "../lib/completed-bars.js";
import { isDailySessionClosed } from "../lib/market-scheduler.js";
import type { OhlcvBar } from "../lib/types.js";
import { evaluateAlert } from "../lib/alert-evaluator.js";

function bar(date: string, close = 100): OhlcvBar {
  return {
    datetime: `${date}T00:00:00.000Z`,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1_000,
  };
}

describe("completed-bars", () => {
  it("descarta la vela de hoy si la sesión aún no cerró", () => {
    // 2026-07-30 12:00 ET = 16:00 UTC (EDT)
    const now = new Date("2026-07-30T16:00:00.000Z");
    expect(isDailySessionClosed(now)).toBe(false);
    const bars = [bar("2026-07-28"), bar("2026-07-29"), bar("2026-07-30")];
    const usable = selectBarsForEvaluation(bars, "1day", now);
    expect(usable.map((b) => b.datetime.slice(0, 10))).toEqual([
      "2026-07-28",
      "2026-07-29",
    ]);
  });

  it("conserva la vela de hoy tras el cierre (≥16:00 ET)", () => {
    // 2026-07-30 16:00 ET = 20:00 UTC
    const now = new Date("2026-07-30T20:00:00.000Z");
    expect(isDailySessionClosed(now)).toBe(true);
    const bars = [bar("2026-07-28"), bar("2026-07-29"), bar("2026-07-30")];
    const usable = selectBarsForEvaluation(bars, "1day", now);
    expect(usable.at(-1)?.datetime.slice(0, 10)).toBe("2026-07-30");
  });

  it("no filtra velas 15min", () => {
    const now = new Date("2026-07-30T16:00:00.000Z");
    const bars = [bar("2026-07-30"), bar("2026-07-30")];
    expect(selectBarsForEvaluation(bars, "15min", now)).toHaveLength(2);
  });

  it("evaluateAlert diario usa la última vela cerrada (no la de hoy abierta)", () => {
    const now = new Date("2026-07-30T16:00:00.000Z");
    const bars = [
      bar("2026-07-27", 100),
      bar("2026-07-28", 100),
      bar("2026-07-29", 99),
      // Hoy incompleta: cruce falso si se evaluara
      bar("2026-07-30", 200),
    ];
    const result = evaluateAlert(
      {
        ticker: "TEST",
        preset_or_custom: "custom",
        timeframe: "1day",
        params: { type: "price_ma", ma_type: "sma", period: 2, direction: "up" },
      },
      bars,
      now,
    );
    expect(result.candleTimestamp.startsWith("2026-07-29")).toBe(true);
  });

  it("evaluateAlert price_level 15min detecta cruce intradía (no descarta vela reciente)", () => {
    const now = new Date("2026-07-30T16:00:00.000Z"); // sesión abierta ET
    const bars = [
      {
        datetime: "2026-07-30T14:30:00.000Z",
        open: 98,
        high: 99,
        low: 97,
        close: 98,
        volume: 1000,
      },
      {
        datetime: "2026-07-30T14:45:00.000Z",
        open: 99,
        high: 152,
        low: 99,
        close: 151,
        volume: 1000,
      },
    ];
    const result = evaluateAlert(
      {
        ticker: "TEST",
        preset_or_custom: "custom",
        timeframe: "15min",
        params: { type: "price_level", level: 150, operator: ">=" },
      },
      bars,
      now,
    );
    expect(result.conditionMet).toBe(true);
    expect(result.candleTimestamp).toBe("2026-07-30T14:45:00.000Z");
  });

  it("assertBarsForEvaluation exige ≥2 velas cerradas", () => {
    const now = new Date("2026-07-30T16:00:00.000Z");
    expect(() =>
      assertBarsForEvaluation([bar("2026-07-30")], "1day", now),
    ).toThrow(/2 velas/);
  });
});
