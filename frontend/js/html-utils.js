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
