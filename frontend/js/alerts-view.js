import { countUniqueActiveTickers } from "./alerts-api.js";
import { alertBadge, alertDisplayLabel, alertKind } from "./alert-labels.js";
import { formatEvaluatedAt } from "./format.js";
import { MAX_UNIQUE_TICKERS } from "./presets.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { setStackLayer } from "./loading.js";
import { alertRowSkeletonHtml } from "./skeletons.js";
import { badgeHtml, escapeAttr, groupByTicker } from "./html-utils.js";
import { quoteBlockHtml } from "./quotes-ui.js";

let rowActions = {
  onEdit: () => {},
  onToggle: () => {},
  onDelete: () => {},
};

export function bindAlertRowActions(actions) {
  rowActions = { ...rowActions, ...actions };
}

export function updateTickerCounter() {
  const count = countUniqueActiveTickers(appState.alerts);
  els.tickerCounter.textContent = `${count} / ${MAX_UNIQUE_TICKERS} tickers activos`;
  els.tickerCounter.classList.toggle("ticker-counter--warning", count >= MAX_UNIQUE_TICKERS);
}

function statusBadgeHtml(alert) {
  if (appState.firedAlertIds.has(alert.id)) {
    return badgeHtml("fired", "Disparada");
  }
  return badgeHtml(alert.active ? "active" : "inactive", alert.active ? "Activa" : "Inactiva");
}

function createAlertRow(alert) {
  if (appState.busyId === alert.id) {
    const row = document.createElement("article");
    row.className = "alert-row alert-row--busy alert-row--nested";
    row.dataset.id = alert.id;
    row.setAttribute("aria-busy", "true");
    row.setAttribute("aria-label", `Actualizando alerta ${alert.ticker}`);
    row.innerHTML = alertRowSkeletonHtml();
    return row;
  }

  const label = alertDisplayLabel(alert);
  const kind = alertKind(alert);
  const badgeText = alertBadge(alert);
  const kindBadge =
    kind === "ema" ? badgeHtml("ema", badgeText) : kind === "rsi" ? badgeHtml("rsi", badgeText) : "";

  const row = document.createElement("article");
  row.className = `alert-row alert-row--nested ${alert.active ? "" : "alert-row--inactive"}`.trim();
  row.dataset.id = alert.id;
  row.innerHTML = `
    <div>
      <div class="alert-row__preset">
        <span class="alert-row__preset-label alert-row__preset-label--truncate" title="${escapeAttr(label)}">${label}</span>
        ${kindBadge}
      </div>
      <div class="alert-row__meta">Última evaluación: ${formatEvaluatedAt(alert.last_evaluated_at)}</div>
    </div>
    ${statusBadgeHtml(alert)}
    <div class="alert-row__actions">
      <button type="button" class="btn-ghost btn-ghost--accent btn-edit" aria-label="Editar alerta ${alert.ticker}">Editar</button>
      <button type="button" class="toggle" role="switch" aria-checked="${alert.active}" aria-label="${alert.active ? "Desactivar" : "Activar"} alerta ${alert.ticker}">
        <span class="toggle__thumb"></span>
      </button>
      <button type="button" class="btn-ghost btn-delete" aria-label="Eliminar alerta ${alert.ticker}">Eliminar</button>
    </div>
  `;

  row.querySelector(".btn-edit").addEventListener("click", () => rowActions.onEdit(alert));
  row.querySelector(".toggle").addEventListener("click", () => rowActions.onToggle(alert, !alert.active));
  row.querySelector(".btn-delete").addEventListener("click", () => rowActions.onDelete(alert));
  return row;
}

export function renderAlerts() {
  updateTickerCounter();
  els.alertList.innerHTML = "";

  if (appState.alerts.length === 0) {
    setStackLayer(els.skeleton, false);
    setStackLayer(els.alertList, false);
    els.alertsStack.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.alertsStack.classList.remove("hidden");
  setStackLayer(els.skeleton, false);
  setStackLayer(els.alertList, true);

  for (const [ticker, groupAlerts] of groupByTicker(appState.alerts)) {
    const group = document.createElement("section");
    group.className = "ticker-group";
    group.setAttribute("aria-label", `Alertas de ${ticker}`);

    const header = document.createElement("div");
    header.className = "ticker-group__header";
    header.innerHTML = `
      <span class="ticker-group__ticker">${ticker}</span>
      <div class="ticker-group__quote">${quoteBlockHtml(ticker)}</div>
    `;
    group.appendChild(header);

    for (const alert of groupAlerts) {
      group.appendChild(createAlertRow(alert));
    }
    els.alertList.appendChild(group);
  }
}
