import { describe, expect, it } from "vitest";
import { isMarketOpen } from "../lib/market-scheduler.js";

describe("market-scheduler", () => {
  it("sábado está cerrado", () => {
    expect(isMarketOpen(new Date("2026-03-07T15:00:00Z"))).toBe(false);
  });

  it("viernes 16:01 EST está cerrado", () => {
    expect(isMarketOpen(new Date("2026-03-06T21:01:00Z"))).toBe(false);
  });

  it("lunes 9:29 EST está cerrado", () => {
    expect(isMarketOpen(new Date("2026-03-02T14:29:00Z"))).toBe(false);
  });

  it("miércoles 12:00 EST está abierto", () => {
    expect(isMarketOpen(new Date("2026-03-04T17:00:00Z"))).toBe(true);
  });
});
