import type { AlertRow } from "./types.js";
import { evaluateAlert } from "./alert-evaluator.js";
import { AlertStore } from "./alert-store.js";
import { loadFixture } from "./fixture-loader.js";
import { fetchBatchOhlcv } from "./twelve-data-fetcher.js";
import type { OhlcvBar } from "./types.js";
import { join } from "node:path";

export interface CycleResult {
  ticker: string;
  preset: string;
  outcome: string;
}

export interface RunCycleOptions {
  useFixtures: boolean;
  fixturesDir?: string;
  twelveDataApiKey?: string;
  fetchImpl?: typeof fetch;
}

export async function runEvaluationCycle(
  alerts: AlertRow[],
  store: AlertStore,
  options: RunCycleOptions,
): Promise<CycleResult[]> {
  const now = new Date();
  const results: CycleResult[] = [];
  let ohlcvByTicker = new Map<string, OhlcvBar[]>();

  if (!options.useFixtures) {
    const apiKey = options.twelveDataApiKey?.trim();
    if (!apiKey) {
      throw new Error("Falta TWELVE_DATA_API_KEY");
    }
    const tickers = alerts.map((a) => a.ticker);
    console.log(`Twelve Data batch: ${tickers.length} alerta(s), tickers únicos en 1 petición.`);
    ohlcvByTicker = await fetchBatchOhlcv(tickers, apiKey, { fetchImpl: options.fetchImpl });
    console.log(`Twelve Data: recibidos ${ohlcvByTicker.size} ticker(s).`);
  }

  const fixturesDir = options.fixturesDir ?? join(process.cwd(), "worker", "fixtures");

  for (const alert of alerts) {
    try {
      const bars = options.useFixtures
        ? loadFixture(alert.ticker, fixturesDir)
        : ohlcvByTicker.get(alert.ticker.toUpperCase());

      if (!bars || bars.length === 0) {
        throw new Error(`Sin datos OHLCV para ${alert.ticker}`);
      }

      const evaluation = evaluateAlert(alert, bars);
      const outcome = evaluation.conditionMet ? "DISPARARÍA" : "NO DISPARARÍA";
      console.log(
        `Alerta ${alert.id} | ticker=${alert.ticker} | preset=${alert.preset_or_custom} | vela=${evaluation.candleTimestamp} | resultado=${outcome}`,
      );
      results.push({ ticker: alert.ticker, preset: alert.preset_or_custom, outcome });
      await store.updateLastEvaluated(alert.id, now);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Alerta ${alert.ticker} (${alert.preset_or_custom}): error — ${message}`);
    }
  }

  return results;
}
