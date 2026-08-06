import { countUniqueActiveTickers } from "./alerts-api.js";
import { alertBadge, alertDisplayLabel, alertKind } from "./alert-labels.js";
import { formatEvaluatedAt } from "./format.js";
import { MAX_UNIQUE_TICKERS } from "./presets.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { setStackLayer } from "./loading.js";
import { alertRowSkeletonHtml } from "./skeletons.js";
import { badgeHtml, escapeAttr, listTickerGroups } from "./html-utils.js";
import { quoteBlockHtml } from "./quotes-ui.js";
import { alertListLabel, timeframeChipHtml } from "./signal-summary.js";

let rowActions = {
  onEdit: () => {},
  onToggle: () => {},
  onDelete: () => {},
  onVerify: () => {},
};

let orderActions = {
  onReorder: () => {},
};

let emptyGroupActions = {
  onCreate: () => {},
  onRemoveTicker: () => {},
};

let dragTicker = null;

export function bindAlertRowActions(actions) {
  rowActions = { ...rowActions, ...actions };
}

export function bindTickerOrderActions(actions) {
  orderActions = { ...orderActions, ...actions };
}

export function bindEmptyGroupActions(actions) {
  emptyGroupActions = { ...emptyGroupActions, ...actions };
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

  const label = alertListLabel(alert);
  const fullLabel = alertDisplayLabel(alert);
  const kind = alertKind(alert);
  const badgeText = alertBadge(alert);
  const kindBadge =
    kind === "ema" ? badgeHtml("ema", badgeText) : kind === "rsi" ? badgeHtml("rsi", badgeText) : "";
  const tf = alert.timeframe === "1day" ? "1day" : "15min";

  const row = document.createElement("article");
  row.className = `alert-row alert-row--nested ${alert.active ? "" : "alert-row--inactive"}`.trim();
  row.dataset.id = alert.id;
  row.innerHTML = `
    <div>
      <div class="alert-row__preset">
        <span class="alert-row__preset-label alert-row__preset-label--truncate" title="${escapeAttr(fullLabel)}">${label}</span>
        ${timeframeChipHtml(tf)}
        ${kindBadge}
      </div>
      <div class="alert-row__meta">Última evaluación: ${formatEvaluatedAt(alert.last_evaluated_at)}${alert.last_evaluated_at ? " ET" : ""}</div>
    </div>
    ${statusBadgeHtml(alert)}
    <div class="alert-row__actions">
      <button type="button" class="btn-ghost btn-ghost--accent btn-verify" aria-label="Verificar ahora alerta ${alert.ticker}" title="Envía un correo con los valores actuales (no consume cupo diario)">Verificar</button>
      <button type="button" class="btn-ghost btn-ghost--accent btn-edit" aria-label="Editar alerta ${alert.ticker}">Editar</button>
      <button type="button" class="toggle" role="switch" aria-checked="${alert.active}" aria-label="${alert.active ? "Desactivar" : "Activar"} alerta ${alert.ticker}">
        <span class="toggle__thumb"></span>
      </button>
      <button type="button" class="btn-ghost btn-delete" aria-label="Eliminar alerta ${alert.ticker}">Eliminar</button>
    </div>
  `;

  row.querySelector(".btn-verify").addEventListener("click", () => rowActions.onVerify(alert));
  row.querySelector(".btn-edit").addEventListener("click", () => rowActions.onEdit(alert));
  row.querySelector(".toggle").addEventListener("click", () => rowActions.onToggle(alert, !alert.active));
  row.querySelector(".btn-delete").addEventListener("click", () => rowActions.onDelete(alert));
  return row;
}

function createEmptyGroupBody(ticker) {
  const body = document.createElement("div");
  body.className = "ticker-group__empty";
  body.innerHTML = `
    <p class="ticker-group__empty-text">Sin alertas</p>
    <div class="ticker-group__empty-actions">
      <button type="button" class="btn-ghost btn-ghost--accent btn-empty-create" aria-label="Nueva alerta para ${escapeAttr(ticker)}">
        Nueva alerta
      </button>
      <button type="button" class="btn-ghost btn-remove-ticker" aria-label="Quitar ticker ${escapeAttr(ticker)}">
        Quitar ticker
      </button>
    </div>
  `;
  body.querySelector(".btn-empty-create").addEventListener("click", () => emptyGroupActions.onCreate(ticker));
  body.querySelector(".btn-remove-ticker").addEventListener("click", () => emptyGroupActions.onRemoveTicker(ticker));
  return body;
}

function clearDropIndicators() {
  for (const el of els.alertList.querySelectorAll(".ticker-group--drop-before, .ticker-group--drop-after")) {
    el.classList.remove("ticker-group--drop-before", "ticker-group--drop-after");
  }
}

function displayedTickerOrder() {
  return listTickerGroups(appState.alerts, appState.tickerOrder).map(([ticker]) => ticker);
}

function bindGroupDrag(group, ticker) {
  const handle = group.querySelector(".ticker-group__drag");
  group.draggable = false;

  handle.addEventListener("mousedown", () => {
    group.draggable = true;
  });
  handle.addEventListener("touchstart", () => {
    group.draggable = true;
  }, { passive: true });
  handle.addEventListener("mouseup", () => {
    if (!dragTicker) group.draggable = false;
  });
  handle.addEventListener("click", (event) => {
    event.preventDefault();
  });

  group.addEventListener("dragstart", (event) => {
    if (!group.draggable) {
      event.preventDefault();
      return;
    }
    dragTicker = ticker;
    group.classList.add("ticker-group--dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ticker);
  });

  group.addEventListener("dragend", () => {
    dragTicker = null;
    group.draggable = false;
    group.classList.remove("ticker-group--dragging");
    clearDropIndicators();
  });

  group.addEventListener("dragover", (event) => {
    if (!dragTicker || dragTicker === ticker) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    clearDropIndicators();
    const rect = group.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    group.classList.add(before ? "ticker-group--drop-before" : "ticker-group--drop-after");
  });

  group.addEventListener("dragleave", (event) => {
    if (!group.contains(event.relatedTarget)) {
      group.classList.remove("ticker-group--drop-before", "ticker-group--drop-after");
    }
  });

  group.addEventListener("drop", (event) => {
    event.preventDefault();
    clearDropIndicators();
    if (!dragTicker || dragTicker === ticker) return;

    const order = displayedTickerOrder();
    const fromIdx = order.indexOf(dragTicker);
    if (fromIdx < 0) return;

    const rect = group.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    const [moved] = order.splice(fromIdx, 1);
    const targetIdx = order.indexOf(ticker);
    if (targetIdx < 0) return;
    const insertAt = before ? targetIdx : targetIdx + 1;
    order.splice(insertAt, 0, moved);

    void orderActions.onReorder(order);
  });
}

export function renderAlerts() {
  updateTickerCounter();
  els.alertList.innerHTML = "";

  const groups = listTickerGroups(appState.alerts, appState.tickerOrder);

  if (groups.length === 0) {
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

  for (const [ticker, groupAlerts] of groups) {
    const group = document.createElement("section");
    group.className = `ticker-group${groupAlerts.length === 0 ? " ticker-group--empty" : ""}`;
    group.dataset.ticker = ticker;
    group.setAttribute(
      "aria-label",
      groupAlerts.length === 0 ? `${ticker} sin alertas` : `Alertas de ${ticker}`,
    );

    const header = document.createElement("div");
    header.className = "ticker-group__header";
    header.innerHTML = `
      <button
        type="button"
        class="ticker-group__drag"
        aria-label="Reordenar ${ticker}"
        title="Arrastra para reordenar"
      >
        <span class="ticker-group__drag-icon" aria-hidden="true"></span>
      </button>
      <span class="ticker-group__ticker">${ticker}</span>
      <div class="ticker-group__quote">${quoteBlockHtml(ticker)}</div>
    `;
    group.appendChild(header);

    if (groupAlerts.length === 0) {
      group.appendChild(createEmptyGroupBody(ticker));
    } else {
      for (const alert of groupAlerts) {
        group.appendChild(createAlertRow(alert));
      }
    }

    bindGroupDrag(group, ticker);
    els.alertList.appendChild(group);
  }
}
