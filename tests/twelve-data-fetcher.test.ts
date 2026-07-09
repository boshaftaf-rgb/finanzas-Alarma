import { describe, expect, it, vi } from "vitest";
import { buildBatchUrl, dedupeTickers, fetchBatchOhlcv } from "../lib/twelve-data-fetcher.js";

describe("twelve-data-fetcher", () => {
  it("deduplica tickers", () => {
    expect(dedupeTickers(["AAPL", "aapl", "MSFT", "AAPL"])).toEqual(["AAPL", "MSFT"]);
  });

  it("divide en varios requests si hay más de 8 símbolos", async () => {
    const symbols = Array.from({ length: 10 }, (_, i) => `S${i}`);
    const sleepMs = vi.fn(async () => {});
    const fetchMock = vi.fn(async (url: string) => {
      const match = url.match(/symbol=([^&]+)/);
      const chunk = decodeURIComponent(match?.[1] ?? "").split(",");
      const body: Record<string, unknown> = {};
      for (const symbol of chunk) {
        body[symbol] = {
          values: [
            { datetime: "2026-03-02 15:00:00", open: "1", high: "2", low: "1", close: "1.5", volume: "100" },
            { datetime: "2026-03-02 15:15:00", open: "1.5", high: "2", low: "1", close: "2", volume: "120" },
          ],
        };
      }
      return new Response(JSON.stringify(body), { status: 200 });
    });

    const data = await fetchBatchOhlcv(symbols, "test-key", { fetchImpl: fetchMock, sleepMs });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMs).toHaveBeenCalledTimes(1);
    expect(data.size).toBe(10);
  });

  it("hace 1 request batch con símbolos únicos", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("symbol=AAPL%2CMSFT%2CNVDA");
      expect(url).toContain("interval=15min");
      return new Response(
        JSON.stringify({
          AAPL: {
            values: [
              { datetime: "2026-03-02 15:00:00", open: "1", high: "2", low: "1", close: "1.5", volume: "100" },
              { datetime: "2026-03-02 15:15:00", open: "1.5", high: "2", low: "1", close: "2", volume: "120" },
            ],
          },
          MSFT: {
            values: [
              { datetime: "2026-03-02 15:00:00", open: "10", high: "11", low: "9", close: "10.5", volume: "200" },
              { datetime: "2026-03-02 15:15:00", open: "10.5", high: "11", low: "9", close: "11", volume: "220" },
            ],
          },
          NVDA: {
            values: [
              { datetime: "2026-03-02 15:00:00", open: "100", high: "101", low: "99", close: "100", volume: "300" },
              { datetime: "2026-03-02 15:15:00", open: "100", high: "102", low: "99", close: "101", volume: "310" },
            ],
          },
        }),
        { status: 200 },
      );
    });

    const tickers = ["AAPL", "MSFT", "AAPL", "NVDA", "MSFT"];
    const data = await fetchBatchOhlcv(tickers, "test-key", { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(data.size).toBe(3);
    expect(data.get("AAPL")).toHaveLength(2);
    expect(data.get("AAPL")?.[0].close).toBe(1.5);
  });

  it("construye URL batch con intervalo 15min", () => {
    const url = buildBatchUrl(["AAPL", "MSFT"], "key-123", 300);
    expect(url).toContain("interval=15min");
    expect(url).toContain("outputsize=300");
    expect(url).toContain("symbol=AAPL%2CMSFT");
  });
});
