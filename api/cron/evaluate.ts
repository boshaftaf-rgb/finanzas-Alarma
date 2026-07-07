import type { VercelRequest, VercelResponse } from "@vercel/node";
import { evaluateAlert } from "../../lib/alert-evaluator.js";
import { AlertStore } from "../../lib/alert-store.js";
import { loadFixture } from "../../lib/fixture-loader.js";
import { isMarketOpen } from "../../lib/market-scheduler.js";
import { join } from "node:path";

function authorize(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

function useFixtures(): boolean {
  return process.env.WORKER_USE_FIXTURES === "true";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!authorize(req)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const force = req.query.force === "true" || req.query.once === "true";
  if (!force && !useFixtures() && !isMarketOpen()) {
    console.log("Mercado cerrado — ciclo omitido.");
    return res.status(200).json({ ok: true, skipped: "mercado_cerrado" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    return res.status(500).json({ error: "Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" });
  }

  const store = new AlertStore(supabaseUrl, serviceRole);
  const alerts = await store.fetchActiveAlerts();

  if (alerts.length === 0) {
    console.log("No hay alertas activas para evaluar.");
    return res.status(200).json({ ok: true, evaluated: 0 });
  }

  console.log(`Evaluando ${alerts.length} alerta(s) activa(s).`);
  const fixturesDir = join(process.cwd(), "worker", "fixtures");
  const results: Array<{ ticker: string; preset: string; outcome: string }> = [];

  for (const alert of alerts) {
    const now = new Date();
    try {
      if (!useFixtures()) {
        console.log(`Alerta ${alert.ticker}: Twelve Data aún no integrado (issue #7).`);
        await store.updateLastEvaluated(alert.id, now);
        continue;
      }

      const bars = loadFixture(alert.ticker, fixturesDir);
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

  console.log("Ciclo completado.");
  return res.status(200).json({ ok: true, evaluated: results.length, results });
}
