import type { AlertRow } from "./types.js";
import { decideFire, formatOutcome, todayMarketDate } from "./alert-fire-policy.js";
import { evaluateAlert } from "./alert-evaluator.js";
import { formatAlertLabel } from "./alert-labels.js";
import { AlertStore } from "./alert-store.js";
import { sendAlertEmail, smtpConfigFromEnv, type SmtpConfig } from "./email-sender.js";
import { loadFixture } from "./fixture-loader.js";
import { fetchBatchOhlcv } from "./twelve-data-fetcher.js";
import type { AlertTimeframe, OhlcvBar } from "./types.js";
import { normalizeTimeframe } from "./types.js";
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
  smtpConfig?: SmtpConfig;
  sendEmails?: boolean;
  today?: string;
  now?: Date;
}

function groupAlertsByTimeframe(alerts: AlertRow[]): Map<AlertTimeframe, AlertRow[]> {
  const groups = new Map<AlertTimeframe, AlertRow[]>();
  for (const alert of alerts) {
    const timeframe = normalizeTimeframe(alert.timeframe);
    const list = groups.get(timeframe) ?? [];
    list.push(alert);
    groups.set(timeframe, list);
  }
  return groups;
}

function uniqueTickers(alerts: AlertRow[]): string[] {
  return [...new Set(alerts.map((a) => a.ticker.toUpperCase()))];
}

export async function runEvaluationCycle(
  alerts: AlertRow[],
  store: AlertStore,
  options: RunCycleOptions,
): Promise<CycleResult[]> {
  const now = options.now ?? new Date();
  const today = options.today ?? todayMarketDate(now);
  const results: CycleResult[] = [];
  const ohlcvByTimeframe = new Map<AlertTimeframe, Map<string, OhlcvBar[]>>();

  if (!options.useFixtures) {
    const apiKey = options.twelveDataApiKey?.trim();
    if (!apiKey) {
      throw new Error("Falta TWELVE_DATA_API_KEY");
    }

    const groups = groupAlertsByTimeframe(alerts);
    for (const [timeframe, group] of groups) {
      const tickers = uniqueTickers(group);
      console.log(
        `Twelve Data batch (${timeframe}): ${group.length} alerta(s), ${tickers.length} ticker(s) únicos.`,
      );
      const data = await fetchBatchOhlcv(tickers, apiKey, {
        fetchImpl: options.fetchImpl,
        interval: timeframe,
      });
      ohlcvByTimeframe.set(timeframe, data);
      console.log(`Twelve Data (${timeframe}): recibidos ${data.size} ticker(s).`);
    }
  }

  const fixturesDir = options.fixturesDir ?? join(process.cwd(), "worker", "fixtures");
  const sendEmails = options.sendEmails !== false;
  let smtpConfig = options.smtpConfig;

  for (const alert of alerts) {
    try {
      const timeframe = normalizeTimeframe(alert.timeframe);
      const bars = options.useFixtures
        ? loadFixture(alert.ticker, fixturesDir)
        : ohlcvByTimeframe.get(timeframe)?.get(alert.ticker.toUpperCase());

      if (!bars || bars.length === 0) {
        throw new Error(`Sin datos OHLCV para ${alert.ticker} (${timeframe})`);
      }

      const evaluation = evaluateAlert(alert, bars);
      const decision = decideFire(
        evaluation.conditionMet,
        alert,
        evaluation.candleTimestamp,
        today,
      );

      let emailSent = false;
      if (decision.shouldSend && sendEmails) {
        if (!smtpConfig) {
          smtpConfig = smtpConfigFromEnv();
        }
        await sendAlertEmail({
          config: smtpConfig,
          ticker: alert.ticker,
          presetOrCustom: alert.preset_or_custom,
          candleTimestamp: evaluation.candleTimestamp,
          alertParams: alert.params,
          timeframe,
        });
        await store.recordEmailSent(alert, evaluation.candleTimestamp, today, now);
        try {
          await store.insertAlertFiring({
            user_id: alert.user_id,
            alert_id: alert.id,
            ticker: alert.ticker.toUpperCase(),
            preset_or_custom: alert.preset_or_custom,
            params: alert.params ?? {},
            timeframe,
            candle_timestamp: evaluation.candleTimestamp,
            label: formatAlertLabel(alert.preset_or_custom, alert.params ?? {}, timeframe),
            sent_at: now.toISOString(),
          });
        } catch (firingError) {
          const msg = firingError instanceof Error ? firingError.message : String(firingError);
          console.error(`Disparo UI no registrado (email ya enviado) | alerta=${alert.id}: ${msg}`);
        }
        emailSent = true;
        console.log(`Email enviado | ticker=${alert.ticker} | preset=${alert.preset_or_custom}`);
      } else if (decision.shouldSend && !sendEmails) {
        console.log(`Email omitido (modo prueba) | ticker=${alert.ticker}`);
      } else {
        await store.updateLastEvaluated(alert.id, now);
      }

      const outcome = formatOutcome(decision, emailSent);
      console.log(
        `Alerta ${alert.id} | ticker=${alert.ticker} | preset=${alert.preset_or_custom} | timeframe=${timeframe} | vela=${evaluation.candleTimestamp} | resultado=${outcome}`,
      );
      results.push({ ticker: alert.ticker, preset: alert.preset_or_custom, outcome });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Alerta ${alert.ticker} (${alert.preset_or_custom}): error — ${message}`);
    }
  }

  return results;
}
