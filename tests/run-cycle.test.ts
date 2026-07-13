import { describe, expect, it, vi } from "vitest";
import { evaluateAlert } from "../lib/alert-evaluator.js";
import { decideFire } from "../lib/alert-fire-policy.js";
import { runEvaluationCycle } from "../lib/run-cycle.js";
import type { AlertRow } from "../lib/types.js";
import { join } from "node:path";

class MockAlertStore {
  updates: Array<Record<string, unknown>> = [];

  async updateLastEvaluated(alertId: string, evaluatedAt = new Date()) {
    this.updates.push({ type: "evaluated", alertId, evaluatedAt });
  }

  async recordEmailSent(
    alert: AlertRow,
    candleTimestamp: string,
    today: string,
    evaluatedAt = new Date(),
  ) {
    this.updates.push({
      type: "email",
      alertId: alert.id,
      candleTimestamp,
      today,
      evaluatedAt,
    });
  }

  async insertAlertFiring(firing: Record<string, unknown>) {
    this.updates.push({ type: "firing", ...firing });
  }
}

describe("run-cycle integration", () => {
  it("envía email y registra disparo con fixtures cuando condición cumple", async () => {
    const sendSpy = vi.spyOn(await import("../lib/email-sender.js"), "sendAlertEmail").mockResolvedValue();

    const alerts: AlertRow[] = [
      {
        id: "a1",
        user_id: "u1",
        ticker: "AAPL",
        preset_or_custom: "ema_cross_bull",
        params: {},
        active: true,
        emails_sent_today: 0,
        email_count_date: null,
        last_triggered_candle: null,
        last_evaluated_at: null,
      },
    ];

    const store = new MockAlertStore() as unknown as import("../lib/alert-store.js").AlertStore;
    const fixturesDir = join(process.cwd(), "worker", "fixtures");

    const results = await runEvaluationCycle(alerts, store, {
      useFixtures: true,
      fixturesDir,
      smtpConfig: {
        host: "smtp.gmail.com",
        port: 587,
        user: "test@gmail.com",
        password: "pwd",
        recipient: "papa@test.com",
      },
      today: "2026-03-04",
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(results[0]?.outcome).toBe("EMAIL ENVIADO");
    const mockStore = store as unknown as MockAlertStore;
    expect(mockStore.updates.some((u) => u.type === "email")).toBe(true);
    expect(mockStore.updates.some((u) => u.type === "firing" && u.alert_id === "a1")).toBe(true);

    sendSpy.mockRestore();
  });

  it("no envía email dos veces en la misma vela (candle-lock)", async () => {
    const sendSpy = vi.spyOn(await import("../lib/email-sender.js"), "sendAlertEmail").mockResolvedValue();

    const candleTs = "2026-03-03T03:00:00.000Z";
    const alerts: AlertRow[] = [
      {
        id: "a1",
        user_id: "u1",
        ticker: "AAPL",
        preset_or_custom: "ema_cross_bull",
        params: {},
        active: true,
        emails_sent_today: 1,
        email_count_date: "2026-03-02",
        last_triggered_candle: candleTs,
        last_evaluated_at: null,
      },
    ];

    const fixturesDir = join(process.cwd(), "worker", "fixtures");
    const bars = (await import("../lib/fixture-loader.js")).loadFixture("AAPL", fixturesDir);
    const evaluation = evaluateAlert(alerts[0], bars);
    const decision = decideFire(true, alerts[0], evaluation.candleTimestamp, "2026-03-04");

    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toBe("candle_lock");

    const store = new MockAlertStore() as unknown as import("../lib/alert-store.js").AlertStore;
    const results = await runEvaluationCycle(alerts, store, {
      useFixtures: true,
      fixturesDir,
      smtpConfig: {
        host: "smtp.gmail.com",
        port: 587,
        user: "test@gmail.com",
        password: "pwd",
        recipient: "papa@test.com",
      },
      today: "2026-03-04",
    });

    expect(sendSpy).not.toHaveBeenCalled();
    expect(results[0]?.outcome).toContain("candle-lock");

    sendSpy.mockRestore();
  });
});
