const QUOTES_MAX_SYMBOLS_PER_BATCH = 8;

function quotesApiError(status, bodyError) {
  if (status === 404) {
    return "Cotizaciones no disponibles: falta el servidor API. En local ejecuta «pnpm run dev» en la raíz del repo (no uses «pnpm serve» ni «pnpm run dev:static»).";
  }
  if (status === 429) {
    return bodyError || "Twelve Data: límite de créditos, reintenta en un minuto";
  }
  return bodyError || `Error ${status} al cargar cotizaciones`;
}

function chunkTickers(tickers, max = QUOTES_MAX_SYMBOLS_PER_BATCH) {
  const chunks = [];
  for (let i = 0; i < tickers.length; i += max) {
    chunks.push(tickers.slice(i, i + max));
  }
  return chunks;
}

function msUntilNextCreditMinute(now = new Date()) {
  const elapsed = now.getSeconds() * 1000 + now.getMilliseconds();
  return 60_000 - elapsed + 1_000;
}

function sleepMs(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function emitProgress(onProgress, payload) {
  try {
    onProgress?.(payload);
  } catch {
    /* el progreso no debe tumbar la carga */
  }
}

async function sleepWithProgress(ms, onTick) {
  const endsAt = Date.now() + ms;
  while (true) {
    const remainingMs = Math.max(0, endsAt - Date.now());
    onTick(remainingMs);
    if (remainingMs === 0) return;
    await sleepMs(Math.min(1000, remainingMs));
  }
}

async function fetchQuoteChunk(tickers, onProgress, loaded, total) {
  const url = `/api/quotes?tickers=${encodeURIComponent(tickers.join(","))}`;
  try {
    let response = await fetch(url);
    let body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      const waitMs = Number(body.retryAfterMs) || msUntilNextCreditMinute();
      await sleepWithProgress(waitMs, (remainingMs) => {
        emitProgress(onProgress, { phase: "retry", loaded, total, remainingMs });
      });
      response = await fetch(url);
      body = await response.json().catch(() => ({}));
    }
    if (!response.ok) {
      return { quotes: {}, error: quotesApiError(response.status, body.error) };
    }
    return { quotes: body.quotes ?? {}, error: null };
  } catch {
    return { quotes: {}, error: "No se pudo conectar con el servicio de cotizaciones" };
  }
}

export async function fetchTickerQuotes(tickers, options = {}) {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return { quotes: {}, error: null };

  const { onProgress } = options;
  const chunks = chunkTickers(unique);
  const total = unique.length;
  const quotes = {};
  let error = null;

  emitProgress(onProgress, {
    phase: "start",
    loaded: 0,
    total,
    chunkCount: chunks.length,
  });

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      await sleepWithProgress(msUntilNextCreditMinute(), (remainingMs) => {
        emitProgress(onProgress, {
          phase: "waiting",
          loaded: Object.keys(quotes).length,
          total,
          remainingMs,
        });
      });
    }

    emitProgress(onProgress, {
      phase: "fetch",
      loaded: Object.keys(quotes).length,
      total,
      chunkIndex: i,
      chunkCount: chunks.length,
    });

    const raw = await fetchQuoteChunk(chunks[i], onProgress, Object.keys(quotes).length, total);
    Object.assign(quotes, raw.quotes);
    if (raw.error) error = raw.error;

    emitProgress(onProgress, {
      phase: "chunk",
      loaded: Object.keys(quotes).length,
      total,
      quotes: raw.quotes,
    });
  }

  if (Object.keys(quotes).length > 0) {
    return { quotes, error };
  }
  return { quotes, error };
}
