import { dedupeTickers } from "./twelve-data-fetcher.js";
import {
  defaultSleep,
  msUntilNextCreditMinute,
  runSymbolBatches,
  type SleepFn,
  type SymbolBatchOptions,
} from "./twelve-data-rate-limit.js";

const TWELVE_DATA_QUOTE = "https://api.twelvedata.com/quote";
const DEBUG_LOG =
  "http://127.0.0.1:7270/ingest/32cd8b27-58a1-4715-bdf4-65491b0657ce";

export interface TickerQuote {
  ticker: string;
  price: number;
  change: number;
  percentChange: number;
  volume: number | null;
  name: string | null;
}

interface TwelveDataQuoteRow {
  symbol?: string;
  name?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  status?: string;
  message?: string;
}

function parseQuote(ticker: string, row: TwelveDataQuoteRow): TickerQuote {
  if (row.status === "error") {
    throw new Error(`Twelve Data (${ticker}): ${row.message ?? "error desconocido"}`);
  }
  const price = Number(row.close);
  if (!Number.isFinite(price)) {
    throw new Error(`Twelve Data (${ticker}): precio inválido`);
  }
  return {
    ticker: ticker.toUpperCase(),
    price,
    change: Number(row.change ?? 0),
    percentChange: Number(row.percent_change ?? 0),
    volume: row.volume != null ? Number(row.volume) : null,
    name: row.name?.trim() || null,
  };
}

function parseBatchQuotes(tickers: string[], payload: Record<string, TwelveDataQuoteRow>): Map<string, TickerQuote> {
  if (payload.symbol && payload.close) {
    const ticker = String(payload.symbol).toUpperCase();
    const map = new Map<string, TickerQuote>();
    map.set(ticker, parseQuote(ticker, payload as TwelveDataQuoteRow));
    return map;
  }

  const result = new Map<string, TickerQuote>();
  for (const ticker of tickers) {
    const row = payload[ticker];
    if (!row) {
      throw new Error(`Twelve Data: falta cotización para ${ticker}`);
    }
    result.set(ticker, parseQuote(ticker, row));
  }
  return result;
}

function logTwelveDataQuote(
  hypothesisId: string,
  data: Record<string, unknown>,
): void {
  // #region agent log
  fetch(DEBUG_LOG, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "73a3d6" },
    body: JSON.stringify({
      sessionId: "73a3d6",
      location: "twelve-data-quotes.ts",
      message: "Twelve Data quote",
      hypothesisId,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function fetchQuotesChunk(
  chunk: string[],
  apiKey: string,
  fetchImpl: typeof fetch,
  sleepMs: SleepFn,
): Promise<Map<string, TickerQuote>> {
  const url = new URL(TWELVE_DATA_QUOTE);
  url.searchParams.set("symbol", chunk.join(","));
  url.searchParams.set("apikey", apiKey);

  logTwelveDataQuote("B", { phase: "request", symbolCount: chunk.length, symbols: chunk });

  let response = await fetchImpl(url.toString());
  if (response.status === 429) {
    logTwelveDataQuote("B", {
      phase: "429-retry",
      symbolCount: chunk.length,
      creditsUsed: response.headers.get("api-credits-used"),
      creditsLeft: response.headers.get("api-credits-left"),
    });
    await sleepMs(msUntilNextCreditMinute());
    response = await fetchImpl(url.toString());
  }

  logTwelveDataQuote("B", {
    phase: "response",
    status: response.status,
    symbolCount: chunk.length,
    creditsUsed: response.headers?.get?.("api-credits-used") ?? null,
    creditsLeft: response.headers?.get?.("api-credits-left") ?? null,
  });

  if (!response.ok) {
    throw new Error(`Twelve Data HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, TwelveDataQuoteRow>;
  if (payload.status === "error") {
    throw new Error(`Twelve Data: ${payload.message ?? "error de API"}`);
  }

  return parseBatchQuotes(chunk, payload);
}

export async function fetchBatchQuotes(
  tickers: string[],
  apiKey: string,
  options?: { fetchImpl?: typeof fetch; sleepMs?: SleepFn; maxSymbolsPerBatch?: number },
): Promise<Map<string, TickerQuote>> {
  const unique = dedupeTickers(tickers);
  if (unique.length === 0) return new Map();

  const fetchImpl = options?.fetchImpl ?? fetch;
  const sleepMs = options?.sleepMs ?? defaultSleep;
  const batchOptions: SymbolBatchOptions = {
    sleepMs,
    maxSymbolsPerBatch: options?.maxSymbolsPerBatch,
  };

  logTwelveDataQuote("B", { phase: "batch-start", totalSymbols: unique.length });

  return runSymbolBatches(
    unique,
    (chunk) => fetchQuotesChunk(chunk, apiKey, fetchImpl, sleepMs),
    batchOptions,
  );
}
