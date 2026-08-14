import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dedupeTickers } from "../lib/twelve-data-fetcher.js";
import { fetchBatchQuotes } from "../lib/twelve-data-quotes.js";
import {
  msUntilNextCreditMinute,
  TWELVE_DATA_MAX_SYMBOLS_PER_BATCH,
} from "../lib/twelve-data-rate-limit.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const raw = req.query.tickers;
  const tickersParam = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.join(",") : "";
  const tickers = dedupeTickers(tickersParam.split(","));

  if (tickers.length === 0) {
    return res.status(400).json({ error: "Parámetro tickers requerido (ej. AAPL,MSFT)" });
  }

  if (tickers.length > TWELVE_DATA_MAX_SYMBOLS_PER_BATCH) {
    return res.status(400).json({
      error: `Máximo ${TWELVE_DATA_MAX_SYMBOLS_PER_BATCH} tickers por petición (límite de créditos Twelve Data)`,
    });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ error: "TWELVE_DATA_API_KEY no configurada" });
  }

  try {
    const map = await fetchBatchQuotes(tickers, apiKey);
    const quotes = Object.fromEntries(map);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ ok: true, quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("429") ? 429 : 502;
    return res.status(status).json(
      status === 429 ? { error: message, retryAfterMs: msUntilNextCreditMinute() } : { error: message },
    );
  }
}
