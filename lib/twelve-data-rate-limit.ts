/** Plan free Twelve Data: 8 API credits/min (1 credit per symbol on time_series & quote). */
export const TWELVE_DATA_MAX_SYMBOLS_PER_BATCH = 8;

export function chunkTickers(
  tickers: string[],
  max = TWELVE_DATA_MAX_SYMBOLS_PER_BATCH,
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < tickers.length; i += max) {
    chunks.push(tickers.slice(i, i + max));
  }
  return chunks;
}

export function msUntilNextCreditMinute(now = new Date()): number {
  const elapsed = now.getSeconds() * 1000 + now.getMilliseconds();
  return 60_000 - elapsed + 1_000;
}

export type SleepFn = (ms: number) => Promise<void>;

export const defaultSleep: SleepFn = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export interface SymbolBatchOptions {
  sleepMs?: SleepFn;
  maxSymbolsPerBatch?: number;
}

export async function runSymbolBatches<T>(
  tickers: string[],
  fetchChunk: (chunk: string[]) => Promise<Map<string, T>>,
  options?: SymbolBatchOptions,
): Promise<Map<string, T>> {
  const unique = tickers;
  if (unique.length === 0) return new Map();

  const sleep = options?.sleepMs ?? defaultSleep;
  const chunks = chunkTickers(unique, options?.maxSymbolsPerBatch);
  const merged = new Map<string, T>();

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      await sleep(msUntilNextCreditMinute());
    }
    const chunkResult = await fetchChunk(chunks[i]);
    for (const [key, value] of chunkResult) {
      merged.set(key, value);
    }
  }

  return merged;
}
