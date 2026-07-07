import { describe, expect, it } from "vitest";
import {
  decideFire,
  effectiveDailyCount,
  formatOutcome,
  todayMarketDate,
} from "../lib/alert-fire-policy.js";
import type { AlertRow } from "../lib/types.js";
import { buildAlertEmail, presetLabel } from "../lib/alert-email-template.js";

const baseAlert: Pick<
  AlertRow,
  "last_triggered_candle" | "emails_sent_today" | "email_count_date"
> = {
  last_triggered_candle: null,
  emails_sent_today: 0,
  email_count_date: null,
};

describe("alert-fire-policy", () => {
  it("no dispara si la condición no se cumple", () => {
    const decision = decideFire(false, baseAlert, "2026-03-04T17:00:00.000Z", "2026-03-04");
    expect(decision.shouldSend).toBe(false);
    expect(formatOutcome(decision, false)).toBe("NO DISPARARÍA");
  });

  it("dispara si condición cumplida y sin bloqueos", () => {
    const decision = decideFire(true, baseAlert, "2026-03-04T17:00:00.000Z", "2026-03-04");
    expect(decision.shouldSend).toBe(true);
  });

  it("candle-lock bloquea misma vela", () => {
    const alert = {
      ...baseAlert,
      last_triggered_candle: "2026-03-04T17:00:00.000Z",
    };
    const decision = decideFire(true, alert, "2026-03-04T17:00:00.000Z", "2026-03-04");
    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toBe("candle_lock");
    expect(formatOutcome(decision, false)).toContain("candle-lock");
  });

  it("permite disparo en vela nueva", () => {
    const alert = {
      ...baseAlert,
      last_triggered_candle: "2026-03-04T16:45:00.000Z",
    };
    const decision = decideFire(true, alert, "2026-03-04T17:00:00.000Z", "2026-03-04");
    expect(decision.shouldSend).toBe(true);
  });

  it("reinicia contador diario si email_count_date es anterior", () => {
    const alert = {
      last_triggered_candle: null,
      emails_sent_today: 10,
      email_count_date: "2026-03-03",
    };
    expect(effectiveDailyCount(alert, "2026-03-04")).toBe(0);
    const decision = decideFire(true, alert, "2026-03-04T17:00:00.000Z", "2026-03-04");
    expect(decision.shouldSend).toBe(true);
  });

  it("bloquea al llegar a 10 emails el mismo día", () => {
    const alert = {
      last_triggered_candle: null,
      emails_sent_today: 10,
      email_count_date: "2026-03-04",
    };
    const decision = decideFire(true, alert, "2026-03-04T17:00:00.000Z", "2026-03-04");
    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toBe("limite_diario");
  });

  it("todayMarketDate usa zona America/New_York", () => {
    const label = todayMarketDate(new Date("2026-03-04T17:00:00.000Z"));
    expect(label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("alert-email-template", () => {
  it("genera asunto y cuerpo en español", () => {
    const email = buildAlertEmail({
      ticker: "AAPL",
      presetOrCustom: "ema_cross_bull",
      candleTimestamp: "2026-03-04T17:00:00.000Z",
    });
    expect(email.subject).toContain("AAPL");
    expect(email.text).toContain("15 minutos");
    expect(email.text).toContain(presetLabel("ema_cross_bull"));
  });
});
