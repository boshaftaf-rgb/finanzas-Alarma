export async function fetchTickerQuotes(tickers) {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return { quotes: {}, error: null };

  try {
    const response = await fetch(`/api/quotes?tickers=${encodeURIComponent(unique.join(","))}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { quotes: {}, error: body.error || `Error ${response.status} al cargar cotizaciones` };
    }
    return { quotes: body.quotes ?? {}, error: null };
  } catch {
    return { quotes: {}, error: "No se pudo conectar con el servicio de cotizaciones" };
  }
}
