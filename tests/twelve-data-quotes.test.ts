import { describe, expect, it, vi } from "vitest";
import { fetchBatchQuotes } from "../lib/twelve-data-quotes.js";

describe("twelve-data-quotes", () => {
  it("obtiene cotizaciones en una sola petición batch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AAPL: {
          symbol: "AAPL",
          name: "Apple Inc",
          close: "198.50",
          change: "1.20",
          percent_change: "0.61",
          volume: "52000000",
        },
        MSFT: {
          symbol: "MSFT",
          name: "Microsoft Corporation",
          close: "420.10",
          change: "-2.30",
          percent_change: "-0.54",
          volume: "21000000",
        },
      }),
    });

    const quotes = await fetchBatchQuotes(["AAPL", "MSFT", "AAPL"], "test-key", {
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("symbol=AAPL%2CMSFT");
    expect(quotes.get("AAPL")?.price).toBe(198.5);
    expect(quotes.get("MSFT")?.percentChange).toBe(-0.54);
  });
});
