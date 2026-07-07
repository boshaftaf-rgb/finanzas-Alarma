export async function fetchTickerQuotes(tickers) {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return {};

  const response = await fetch(`/api/quotes?tickers=${encodeURIComponent(unique.join(","))}`);
  if (!response.ok) {
    return {};
  }
  const body = await response.json();
  return body.quotes ?? {};
}
