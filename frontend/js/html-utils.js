export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function badgeHtml(variant, text) {
  return `<span class="badge badge--${variant}">${text}</span>`;
}

export function groupByTicker(items, tickerOrder) {
  const groups = new Map();
  for (const item of items) {
    const key = String(item.ticker || "").toUpperCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const entries = [...groups.entries()];
  if (!tickerOrder || tickerOrder.length === 0) {
    return entries.sort(([a], [b]) => a.localeCompare(b));
  }

  const rank = new Map(
    tickerOrder.map((ticker, index) => [String(ticker).toUpperCase(), index]),
  );

  return entries.sort(([a], [b]) => {
    const ra = rank.has(a) ? rank.get(a) : Number.POSITIVE_INFINITY;
    const rb = rank.has(b) ? rank.get(b) : Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

/**
 * Lista guardada de tickers (orden) unida a alertas.
 * Incluye tickers de tickerOrder aunque no tengan alertas.
 * @returns {Array<[string, object[]]>}
 */
export function listTickerGroups(alerts, tickerOrder) {
  const groups = new Map();

  for (const ticker of tickerOrder ?? []) {
    const key = String(ticker || "").toUpperCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
  }

  for (const alert of alerts ?? []) {
    const key = String(alert.ticker || "").toUpperCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(alert);
  }

  const orderedKeys = [];
  const seenOrder = new Set();
  for (const t of tickerOrder ?? []) {
    const key = String(t || "").toUpperCase();
    if (!key || seenOrder.has(key)) continue;
    seenOrder.add(key);
    orderedKeys.push(key);
  }
  const extras = [...groups.keys()]
    .filter((key) => !seenOrder.has(key))
    .sort((a, b) => a.localeCompare(b));

  return [...orderedKeys, ...extras].map((key) => [key, groups.get(key)]);
}
