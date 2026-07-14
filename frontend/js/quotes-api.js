function quotesApiError(status, bodyError) {
  if (status === 404) {
    return "Cotizaciones no disponibles: falta el servidor API. En local ejecuta «npm run dev» en la raíz del repo (no uses «npm run dev:static»).";
  }
  return bodyError || `Error ${status} al cargar cotizaciones`;
}

export async function fetchTickerQuotes(tickers) {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return { quotes: {}, error: null };

  const url = `/api/quotes?tickers=${encodeURIComponent(unique.join(","))}`;

  try {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));
    // #region agent log
    fetch("http://127.0.0.1:7270/ingest/32cd8b27-58a1-4715-bdf4-65491b0657ce", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4efbc2" },
      body: JSON.stringify({
        sessionId: "4efbc2",
        runId: "pre-fix",
        location: "quotes-api.js",
        message: "fetch quotes response",
        hypothesisId: "A,B",
        data: {
          status: response.status,
          ok: response.ok,
          tickerCount: unique.length,
          tickers: unique,
          error: body.error ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!response.ok) {
      return { quotes: {}, error: quotesApiError(response.status, body.error) };
    }
    return { quotes: body.quotes ?? {}, error: null };
  } catch {
    return { quotes: {}, error: "No se pudo conectar con el servicio de cotizaciones" };
  }
}
