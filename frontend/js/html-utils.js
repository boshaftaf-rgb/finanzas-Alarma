export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function badgeHtml(variant, text) {
  return `<span class="badge badge--${variant}">${text}</span>`;
}

export function groupByTicker(items) {
  const groups = new Map();
  for (const item of items) {
    const key = String(item.ticker || "").toUpperCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}
