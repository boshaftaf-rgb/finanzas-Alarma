import type { OhlcvBar } from "./types.js";
import {
  defaultSleep,
  msUntilNextCreditMinute,
  runSymbolBatches,
  type SleepFn,
  type SymbolBatchOptions,
} from "./twelve-data-rate-limit.js";

const TWELVE_DATA_BASE = "https://api.twelvedata.com/time_series";

export type TwelveDataInterval = "15min" | "1day";
const DEBUG_LOG =
  "http://127.0.0.1:7270/ingest/32cd8b27-58a1-4715-bdf4-65491b0657ce";
const DEFAULT_OUTPUT_SIZE = 300;

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface TwelveDataSeries {
  meta?: { symbol?: string };
  values?: TwelveDataCandle[];
  status?: string;
  message?: string;
}

export function dedupeTickers(tickers: string[]): string[] {
  return [...new Set(tickers.map((t) => t.toUpperCase().trim()).filter(Boolean))];
}

function parseCandle(row: TwelveDataCandle): OhlcvBar {
  return {
    datetime: row.datetime.includes("T")
      ? new Date(row.datetime).toISOString()
      : new Date(row.datetime.replace(" ", "T") + "Z").toISOString(),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume ?? 0),
  };
}

function parseSeries(symbol: string, series: TwelveDataSeries): OhlcvBar[] {
  if (series.status === "error") {
    throw new Error(`Twelve Data (${symbol}): ${series.message ?? "error desconocido"}`);
  }
  const values = series.values ?? [];
  if (values.length === 0) {
    throw new Error(`Twelve Data (${symbol}): sin velas`);
  }
  return values
    .map(parseCandle)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

function parseBatchResponse(
  tickers: string[],
  payload: Record<string, TwelveDataSeries>,
): Map<string, OhlcvBar[]> {
  if (payload.values && payload.meta) {
    const symbol = String(payload.meta.symbol ?? tickers[0] ?? "").toUpperCase();
    const map = new Map<string, OhlcvBar[]>();
    map.set(symbol, parseSeries(symbol, payload as TwelveDataSeries));
    return map;
  }

  const result = new Map<string, OhlcvBar[]>();
  for (const ticker of tickers) {
    const series = payload[ticker];
    if (!series) {
      throw new Error(`Twelve Data: falta respuesta para ${ticker}`);
    }
    result.set(ticker, parseSeries(ticker, series));
  }
  return result;
}

function logTwelveDataOhlcv(
  hypothesisId: string,
  data: Record<string, unknown>,
): void {
  // #region agent log
  fetch(DEBUG_LOG, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "73a3d6" },
    body: JSON.stringify({
      sessionId: "73a3d6",
      location: "twelve-data-fetcher.ts",
      message: "Twelve Data OHLCV",
      hypothesisId,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function fetchOhlcvChunk(
  chunk: string[],
  apiKey: string,
  fetchImpl: typeof fetch,
  outputsize: number,
  sleepMs: SleepFn,
  interval: TwelveDataInterval,
): Promise<Map<string, OhlcvBar[]>> {
  const url = new URL(TWELVE_DATA_BASE);
  url.searchParams.set("symbol", chunk.join(","));
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("apikey", apiKey);

  logTwelveDataOhlcv("A", { phase: "request", symbolCount: chunk.length, symbols: chunk });

  let response = await fetchImpl(url.toString());
  if (response.status === 429) {
    logTwelveDataOhlcv("B", {
      phase: "429-retry",
      symbolCount: chunk.length,
      creditsUsed: response.headers.get("api-credits-used"),
      creditsLeft: response.headers.get("api-credits-left"),
    });
    await sleepMs(msUntilNextCreditMinute());
    response = await fetchImpl(url.toString());
  }

  logTwelveDataOhlcv("A", {
    phase: "response",
    status: response.status,
    symbolCount: chunk.length,
    creditsUsed: response.headers?.get?.("api-credits-used") ?? null,
    creditsLeft: response.headers?.get?.("api-credits-left") ?? null,
  });

  if (!response.ok) {
    throw new Error(`Twelve Data HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, TwelveDataSeries>;
  if (payload.status === "error") {
    throw new Error(`Twelve Data: ${payload.message ?? "error de API"}`);
  }

  return parseBatchResponse(chunk, payload);
}

export async function fetchBatchOhlcv(
  tickers: string[],
  apiKey: string,
  options?: {
    interval?: TwelveDataInterval;
    outputsize?: number;
    fetchImpl?: typeof fetch;
    sleepMs?: SleepFn;
    maxSymbolsPerBatch?: number;
  },
): Promise<Map<string, OhlcvBar[]>> {
  const unique = dedupeTickers(tickers);
  if (unique.length === 0) return new Map();

  const fetchImpl = options?.fetchImpl ?? fetch;
  const interval = options?.interval ?? "15min";
  const outputsize = options?.outputsize ?? DEFAULT_OUTPUT_SIZE;
  const sleepMs = options?.sleepMs ?? defaultSleep;
  const batchOptions: SymbolBatchOptions = {
    sleepMs,
    maxSymbolsPerBatch: options?.maxSymbolsPerBatch,
  };

  logTwelveDataOhlcv("A", { phase: "batch-start", totalSymbols: unique.length, interval });

  return runSymbolBatches(
    unique,
    (chunk) => fetchOhlcvChunk(chunk, apiKey, fetchImpl, outputsize, sleepMs, interval),
    batchOptions,
  );
}

export function buildBatchUrl(
  tickers: string[],
  apiKey: string,
  outputsize = DEFAULT_OUTPUT_SIZE,
  interval: TwelveDataInterval = "15min",
): string {
  const url = new URL(TWELVE_DATA_BASE);
  url.searchParams.set("symbol", dedupeTickers(tickers).join(","));
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("apikey", apiKey);
  return url.toString();
}
