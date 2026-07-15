import { describe, expect, it, beforeEach } from "vitest";
import { join } from "node:path";
import { buildAlertSnapshot } from "../lib/alert-snapshot.js";
import { buildVerifyAlertEmail } from "../lib/alert-email-template.js";
import { loadFixture } from "../lib/fixture-loader.js";
import {
  checkVerifyRateLimit,
  clearVerifyRateLimit,
  markVerifySent,
  VERIFY_COOLDOWN_MS,
} from "../lib/verify-alert-rate-limit.js";

describe("alert-snapshot", () => {
  const fixturesDir = join(process.cwd(), "worker", "fixtures");

  it("incluye cierre, RSI y conditionMet para preset rsi", () => {
    const bars = loadFixture("AAPL", fixturesDir);
    const snapshot = buildAlertSnapshot(
      {
        ticker: "AAPL",
        preset_or_custom: "rsi_oversold",
        params: { period: 14, threshold: 30 },
        timeframe: "1day",
      },
      bars,
    );

    expect(snapshot.ticker).toBe("AAPL");
    expect(Number.isFinite(snapshot.close)).toBe(true);
    expect(snapshot.valueLines.some((l) => l.startsWith("RSI(14):"))).toBe(true);
    expect(typeof snapshot.conditionMet).toBe("boolean");
    expect(snapshot.candleTimestamp).toBeTruthy();
  });

  it("incluye EMAs para cruce alcista corto", () => {
    const bars = loadFixture("AAPL", fixturesDir);
    const snapshot = buildAlertSnapshot(
      {
        ticker: "AAPL",
        preset_or_custom: "ema_cross_bull",
        params: {},
        timeframe: "15min",
      },
      bars,
    );

    expect(snapshot.valueLines.some((l) => l.startsWith("EMA(9):"))).toBe(true);
    expect(snapshot.valueLines.some((l) => l.startsWith("EMA(21):"))).toBe(true);
  });
});

describe("buildVerifyAlertEmail", () => {
  it("marca verificación y valores para contrastar con gráfico", () => {
    const email = buildVerifyAlertEmail({
      ticker: "AAPL",
      presetOrCustom: "rsi_oversold",
      candleTimestamp: "2026-03-04T17:00:00.000Z",
      timeframe: "1day",
      close: 214.35,
      valueLines: ["RSI(14): 28.7"],
      conditionMet: true,
    });

    expect(email.subject.startsWith("Verificación AAPL:")).toBe(true);
    expect(email.text).toContain("Cierre: 214.35");
    expect(email.text).toContain("RSI(14): 28.7");
    expect(email.text).toContain("Cumple condición: sí");
    expect(email.text).toContain("no es un disparo");
  });

  it("indica cuando la condición no se cumple", () => {
    const email = buildVerifyAlertEmail({
      ticker: "MSFT",
      presetOrCustom: "ema_cross_bull",
      candleTimestamp: "2026-03-04T17:00:00.000Z",
      close: 400,
      valueLines: ["EMA(9): 401.00", "EMA(21): 399.50"],
      conditionMet: false,
    });

    expect(email.text).toContain("Cumple condición: no");
  });
});

describe("verify-alert-rate-limit", () => {
  beforeEach(() => {
    clearVerifyRateLimit();
  });

  it("permite la primera verificación y bloquea la segunda en cooldown", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(checkVerifyRateLimit(id, 1_000).ok).toBe(true);
    markVerifySent(id, 1_000);
    const blocked = checkVerifyRateLimit(id, 1_000 + 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("permite de nuevo tras el cooldown", () => {
    const id = "22222222-2222-4222-8222-222222222222";
    markVerifySent(id, 1_000);
    expect(checkVerifyRateLimit(id, 1_000 + VERIFY_COOLDOWN_MS).ok).toBe(true);
  });
});
