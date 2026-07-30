import { describe, expect, it } from "vitest";
import { formatCandleForEmail } from "../lib/alert-email-template.js";

describe("formatCandleForEmail", () => {
  it("vela diaria usa la fecha calendario Twelve Data (sin −1 día ET)", () => {
    // Twelve Data 1day: "2026-07-29" → stored as UTC midnight
    const label = formatCandleForEmail("2026-07-29T00:00:00.000Z", "1day");
    expect(label).toMatch(/29/);
    expect(label).not.toMatch(/28/);
  });

  it("vela 15min sigue en America/New_York", () => {
    // 2026-07-29 15:00 ET (EDT = UTC-4) = 19:00 UTC
    const label = formatCandleForEmail("2026-07-29T19:00:00.000Z", "15min");
    expect(label).toMatch(/29/);
  });
});
