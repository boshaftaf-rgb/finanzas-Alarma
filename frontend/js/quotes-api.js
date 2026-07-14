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
    if (!response.ok) {
      return { quotes: {}, error: quotesApiError(response.status, body.error) };
    }
    return { quotes: body.quotes ?? {}, error: null };
  } catch {
    return { quotes: {}, error: "No se pudo conectar con el servicio de cotizaciones" };
  }
}
