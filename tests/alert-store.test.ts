import { describe, expect, it } from "vitest";
import { buildEmailSentUpdate } from "../lib/alert-store.js";

describe("buildEmailSentUpdate", () => {
  it("apaga la alerta y registra candle-lock y cupo diario", () => {
    const evaluatedAt = new Date("2026-03-04T17:00:00.000Z");
    const patch = buildEmailSentUpdate(
      { emails_sent_today: 0, email_count_date: null },
      "2026-03-04T17:00:00.000Z",
      "2026-03-04",
      evaluatedAt,
    );

    expect(patch.active).toBe(false);
    expect(patch.last_triggered_candle).toBe("2026-03-04T17:00:00.000Z");
    expect(patch.emails_sent_today).toBe(1);
    expect(patch.email_count_date).toBe("2026-03-04");
    expect(patch.last_evaluated_at).toBe(evaluatedAt.toISOString());
  });

  it("reinicia el cupo si email_count_date es de otro día", () => {
    const patch = buildEmailSentUpdate(
      { emails_sent_today: 9, email_count_date: "2026-03-03" },
      "2026-03-04T17:00:00.000Z",
      "2026-03-04",
      new Date("2026-03-04T17:00:00.000Z"),
    );

    expect(patch.active).toBe(false);
    expect(patch.emails_sent_today).toBe(1);
  });
});
