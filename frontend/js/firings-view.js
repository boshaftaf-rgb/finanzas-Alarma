import { countFirings } from "./firings-api.js";
import { formatCandleAt, formatPrice, formatSentAt } from "./format.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { setStackLayer } from "./loading.js";
import { escapeAttr, groupByTicker } from "./html-utils.js";

let rowActions = {
  onDelete: () => {},
};

export function bindFiringRowActions(actions) {
  rowActions = { ...rowActions, ...actions };
}

export function updateFiringsBadge() {
  const count = countFirings(appState.firings);
  if (count > 0) {
    els.firingsBadge.textContent = count > 99 ? "99+" : String(count);
    els.firingsBadge.classList.remove("hidden");
    els.btnFirings.setAttribute("aria-label", `Ver disparos (${count})`);
  } else {
    els.firingsBadge.classList.add("hidden");
    els.btnFirings.setAttribute("aria-label", "Ver disparos");
  }
}

function formatDetectedValues(firing) {
  const parts = [];
  const close = Number(firing.close_price);
  if (Number.isFinite(close)) {
    parts.push(`Cierre: ${formatPrice(close)}`);
  }
  const lines = Array.isArray(firing.value_lines) ? firing.value_lines : [];
  for (const line of lines) {
    if (typeof line === "string" && line.trim()) parts.push(line.trim());
  }
  return parts;
}

export function renderFirings() {
  els.firingsList.innerHTML = "";
  updateFiringsBadge();

  if (appState.firings.length === 0) {
    setStackLayer(els.firingsSkeleton, false);
    setStackLayer(els.firingsList, false);
    els.firingsStack.classList.add("hidden");
    els.firingsEmpty.classList.remove("hidden");
    return;
  }

  els.firingsEmpty.classList.add("hidden");
  els.firingsStack.classList.remove("hidden");
  setStackLayer(els.firingsSkeleton, false);
  setStackLayer(els.firingsList, true);
  for (const [ticker, groupFirings] of groupByTicker(appState.firings)) {
    const group = document.createElement("section");
    group.className = "ticker-group";
    group.setAttribute("aria-label", `Disparos de ${ticker}`);

    const header = document.createElement("div");
    header.className = "ticker-group__header";
    header.innerHTML = `<span class="ticker-group__ticker">${ticker}</span>`;
    group.appendChild(header);

    const sorted = [...groupFirings].sort(
      (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime(),
    );

    for (const firing of sorted) {
      const isDaily = firing.timeframe === "1day";
      const tfLabel = isDaily ? "Diario" : "15 min";
      const candleLabel = formatCandleAt(firing.candle_timestamp, firing.timeframe);
      const candleSuffix = isDaily ? "" : " ET";
      const detected = formatDetectedValues(firing);
      const valuesHtml =
        detected.length > 0
          ? `<div class="firing-row__values">${detected.map((p) => escapeAttr(p)).join(" · ")}</div>`
          : "";
      const row = document.createElement("article");
      row.className = "firing-row";
      row.dataset.id = firing.id;
      row.innerHTML = `
        <div>
          <div class="firing-row__label">${escapeAttr(firing.label)}</div>
          ${valuesHtml}
          <div class="firing-row__meta">
            ${tfLabel} · Vela ${candleLabel}${candleSuffix} · Enviado ${formatSentAt(firing.sent_at)} ET
          </div>
        </div>
        <button type="button" class="btn-ghost btn-delete-firing" aria-label="Borrar disparo de ${ticker}">Borrar</button>
      `;
      row.querySelector(".btn-delete-firing").addEventListener("click", () => rowActions.onDelete(firing));
      group.appendChild(row);
    }
    els.firingsList.appendChild(group);
  }
}
