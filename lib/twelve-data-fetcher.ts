import type { OhlcvBar } from "./types.js";

const TWELVE_DATA_BASE = "https://api.twelvedata.com/time_series";
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

export async function fetchBatchOhlcv(
  tickers: string[],
  apiKey: string,
  options?: { outputsize?: number; fetchImpl?: typeof fetch },
): Promise<Map<string, OhlcvBar[]>> {
  const unique = dedupeTickers(tickers);
  if (unique.length === 0) return new Map();

  const url = new URL(TWELVE_DATA_BASE);
  url.searchParams.set("symbol", unique.join(","));
  url.searchParams.set("interval", "15min");
  url.searchParams.set("outputsize", String(options?.outputsize ?? DEFAULT_OUTPUT_SIZE));
  url.searchParams.set("apikey", apiKey);

  const fetchImpl = options?.fetchImpl ?? fetch;
  const response = await fetchImpl(url.toString());
  if (!response.ok) {
    throw new Error(`Twelve Data HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, TwelveDataSeries>;
  if (payload.status === "error") {
    throw new Error(`Twelve Data: ${payload.message ?? "error de API"}`);
  }

  return parseBatchResponse(unique, payload);
}

export function buildBatchUrl(tickers: string[], apiKey: string, outputsize = DEFAULT_OUTPUT_SIZE): string {
  const url = new URL(TWELVE_DATA_BASE);
  url.searchParams.set("symbol", dedupeTickers(tickers).join(","));
  url.searchParams.set("interval", "15min");
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("apikey", apiKey);
  return url.toString();
}
