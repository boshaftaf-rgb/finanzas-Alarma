import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AlertStore } from "../lib/alert-store.js";
import { buildAlertSnapshot } from "../lib/alert-snapshot.js";
import { sendVerifyAlertEmail, smtpConfigFromEnv } from "../lib/email-sender.js";
import { fetchBatchOhlcv } from "../lib/twelve-data-fetcher.js";
import { normalizeTimeframe } from "../lib/types.js";
import {
  checkVerifyRateLimit,
  markVerifySent,
} from "../lib/verify-alert-rate-limit.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readAlertId(req: VercelRequest): string | null {
  const body = req.body;
  if (body && typeof body === "object" && typeof body.alertId === "string") {
    return body.alertId.trim();
  }
  const q = req.query.alertId;
  if (typeof q === "string") return q.trim();
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const alertId = readAlertId(req);
  if (!alertId || !UUID_RE.test(alertId)) {
    return res.status(400).json({ error: "alertId UUID válido requerido" });
  }

  const rate = checkVerifyRateLimit(alertId);
  if (!rate.ok) {
    return res.status(429).json({
      error: `Espera ${rate.retryAfterSec}s antes de volver a verificar esta alerta`,
      retryAfterSec: rate.retryAfterSec,
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!supabaseUrl || !serviceRole) {
    return res.status(500).json({ error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" });
  }
  if (!apiKey) {
    return res.status(500).json({ error: "TWELVE_DATA_API_KEY no configurada" });
  }

  let smtpConfig;
  try {
    smtpConfig = smtpConfigFromEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }

  const store = new AlertStore(supabaseUrl, serviceRole);
  const alert = await store.fetchAlertById(alertId);
  if (!alert) {
    return res.status(404).json({ error: "Alerta no encontrada" });
  }

  const interval = normalizeTimeframe(alert.timeframe);
  const ticker = String(alert.ticker).toUpperCase();

  try {
    const map = await fetchBatchOhlcv([ticker], apiKey, { interval });
    const bars = map.get(ticker);
    if (!bars || bars.length < 2) {
      return res.status(502).json({ error: `Sin velas suficientes para ${ticker}` });
    }

    const snapshot = buildAlertSnapshot(alert, bars);
    await sendVerifyAlertEmail({ config: smtpConfig, snapshot });
    markVerifySent(alertId);

    return res.status(200).json({
      ok: true,
      sent: true,
      ticker: snapshot.ticker,
      conditionMet: snapshot.conditionMet,
      close: snapshot.close,
      candleTimestamp: snapshot.candleTimestamp,
      valueLines: snapshot.valueLines,
      recipient: smtpConfig.recipient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`verify-alert: ${message}`);
    return res.status(502).json({ error: message });
  }
}
