import { dedupeTickers } from "./twelve-data-fetcher.js";
import {
  defaultSleep,
  msUntilNextCreditMinute,
  runSymbolBatches,
  type SleepFn,
  type SymbolBatchOptions,
} from "./twelve-data-rate-limit.js";

const TWELVE_DATA_QUOTE = "https://api.twelvedata.com/quote";

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

async function fetchQuotesChunk(
  chunk: string[],
  apiKey: string,
  fetchImpl: typeof fetch,
  sleepMs: SleepFn,
): Promise<Map<string, TickerQuote>> {
  const url = new URL(TWELVE_DATA_QUOTE);
  url.searchParams.set("symbol", chunk.join(","));
  url.searchParams.set("apikey", apiKey);

  let response = await fetchImpl(url.toString());
  if (response.status === 429) {
    await sleepMs(msUntilNextCreditMinute());
    response = await fetchImpl(url.toString());
  }

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

  return runSymbolBatches(
    unique,
    (chunk) => fetchQuotesChunk(chunk, apiKey, fetchImpl, sleepMs),
    batchOptions,
  );
}
