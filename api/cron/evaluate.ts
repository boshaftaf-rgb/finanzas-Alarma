import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AlertStore } from "../../lib/alert-store.js";
import { isMarketOpen } from "../../lib/market-scheduler.js";
import { runEvaluationCycle } from "../../lib/run-cycle.js";

function getBearerToken(req: VercelRequest): string | undefined {
  const raw = req.headers.authorization ?? req.headers.Authorization;
  if (!raw || typeof raw !== "string") return undefined;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function authorize(req: VercelRequest): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, reason: "CRON_SECRET no está en Vercel (o redeploy pendiente)" };
  }
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, reason: "Falta header Authorization: Bearer ..." };
  }
  if (token !== secret) {
    return { ok: false, reason: "CRON_SECRET no coincide con el Bearer enviado" };
  }
  return { ok: true };
}

function useFixtures(): boolean {
  return process.env.WORKER_USE_FIXTURES === "true";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = authorize(req);
  if (!auth.ok) {
    return res.status(401).json({
      error: "No autorizado",
      hint: auth.reason,
      cron_secret_configured: Boolean(process.env.CRON_SECRET?.trim()),
    });
  }

  const force = req.query.force === "true" || req.query.once === "true";
  const fixtures = useFixtures();

  if (!force && !fixtures && !isMarketOpen()) {
    console.log("Mercado cerrado — ciclo omitido (sin llamada a Twelve Data).");
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

  console.log(`Evaluando ${alerts.length} alerta(s) activa(s). Fuente: ${fixtures ? "fixtures" : "Twelve Data"}.`);

  try {
    const results = await runEvaluationCycle(alerts, store, {
      useFixtures: fixtures,
      twelveDataApiKey: process.env.TWELVE_DATA_API_KEY,
    });
    console.log("Ciclo completado.");
    return res.status(200).json({ ok: true, evaluated: results.length, results, source: fixtures ? "fixtures" : "twelve_data" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error en ciclo: ${message}`);
    return res.status(500).json({ error: message });
  }
}
