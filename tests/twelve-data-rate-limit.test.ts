import { describe, expect, it, vi } from "vitest";
import {
  chunkTickers,
  msUntilNextCreditMinute,
  runSymbolBatches,
  TWELVE_DATA_MAX_SYMBOLS_PER_BATCH,
} from "../lib/twelve-data-rate-limit.js";

describe("twelve-data-rate-limit", () => {
  it("divide tickers en bloques de 8", () => {
    const tickers = Array.from({ length: 15 }, (_, i) => `T${i}`);
    expect(chunkTickers(tickers)).toEqual([
      tickers.slice(0, 8),
      tickers.slice(8, 15),
    ]);
    expect(TWELVE_DATA_MAX_SYMBOLS_PER_BATCH).toBe(8);
  });

  it("espera entre bloques cuando hay más de 8 símbolos", async () => {
    const sleepMs = vi.fn(async () => {});
    const fetchChunk = vi.fn(async (chunk: string[]) => {
      const map = new Map<string, number>();
      for (const ticker of chunk) map.set(ticker, 1);
      return map;
    });

    const tickers = Array.from({ length: 10 }, (_, i) => `S${i}`);
    const result = await runSymbolBatches(tickers, fetchChunk, { sleepMs });

    expect(fetchChunk).toHaveBeenCalledTimes(2);
    expect(fetchChunk.mock.calls[0]?.[0]).toHaveLength(8);
    expect(fetchChunk.mock.calls[1]?.[0]).toHaveLength(2);
    expect(sleepMs).toHaveBeenCalledTimes(1);
    expect(result.size).toBe(10);
  });

  it("calcula ms hasta el siguiente minuto de créditos", () => {
    const now = new Date("2026-07-09T12:00:30.500Z");
    expect(msUntilNextCreditMinute(now)).toBe(30_500);
  });
});
