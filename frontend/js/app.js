import { initTextSize } from "./text-size.js";
import { loadAppConfig } from "./config.js";
import {
  createAlert,
  deleteAlert,
  fetchAlerts,
  initAlertsApi,
  setAlertActive,
  updateAlert,
} from "./alerts-api.js";
import {
  alertIdsWithFirings,
  deleteFiring,
  fetchFirings,
  initFiringsApi,
} from "./firings-api.js";
import {
  deleteTickerOrder,
  fetchTickerOrder,
  initTickerOrderApi,
  saveTickerOrder,
} from "./ticker-order-api.js";
import { alertDisplayLabel } from "./alert-labels.js";
import { mapDbError } from "./format.js";
import { showBanner, hideBanner } from "./banner.js";
import { setLoading, setFiringsLoading } from "./loading.js";
import { renderSkeleton, renderFiringsSkeleton } from "./skeletons.js";
import { appState } from "./app-state.js";
import { els } from "./dom.js";
import {
  renderAlerts,
  bindAlertRowActions,
  bindEmptyGroupActions,
  bindTickerOrderActions,
} from "./alerts-view.js";
import { renderFirings, bindFiringRowActions, updateFiringsBadge } from "./firings-view.js";
import { showAlertsView, showFiringsView } from "./navigation.js";
import { loadQuotes, previewTickerQuote } from "./quotes-controller.js";
import {
  closeModal,
  openCreateModal,
  openEditModal,
  readCreateTicker,
  applyPriceMaPeriodShortcut,
  setCustomType,
  setFormMode,
  setSubmitLoading,
  syncPriceLevelOperator,
  updatePriceRangeBand,
  updateStochHint,
  updateTimeframeHint,
} from "./alert-form.js";
import { renderPresetGrid, updatePresetRsiHint } from "./form-presets.js";
import { updateSignalSummary } from "./signal-summary.js";
import { validateFormPayload } from "./form-validation.js";
import { verifyAlert } from "./verify-alert-api.js";

let alertsLoadInFlight = false;

function syncFiringsState(list) {
  appState.firings = list;
  appState.firedAlertIds = alertIdsWithFirings(appState.firings);
  updateFiringsBadge();
}

function tickerKey(ticker) {
  return String(ticker).toUpperCase();
}

function orderHasTicker(order, ticker) {
  const key = tickerKey(ticker);
  return order.some((t) => tickerKey(t) === key);
}

/** Append alert tickers missing from saved order; returns true if order changed. */
function mergeAlertTickersIntoOrder(alerts, order) {
  const next = [...order];
  let changed = false;
  const seen = new Set(next.map(tickerKey));
  for (const alert of alerts) {
    const key = tickerKey(alert.ticker);
    if (!key || seen.has(key)) continue;
    next.push(key);
    seen.add(key);
    changed = true;
  }
  return { order: next, changed };
}

async function ensureTickerInOrder(ticker) {
  const key = tickerKey(ticker);
  if (!key || orderHasTicker(appState.tickerOrder, key)) return;
  const next = [...appState.tickerOrder, key];
  appState.tickerOrder = next;
  await saveTickerOrder(next);
}

async function loadFirings() {
  setFiringsLoading(true);
  renderFiringsSkeleton();
  try {
    const list = await fetchFirings();
    syncFiringsState(list);
    if (appState.currentView === "firings") renderFirings();
    else renderAlerts();
  } catch (error) {
    setFiringsLoading(false);
    if (appState.currentView === "firings") renderFirings();
    const message = error instanceof Error ? error.message : "Error desconocido";
    showBanner("error", mapDbError(message));
  }
}

async function loadAlerts({ quiet = false } = {}) {
  if (alertsLoadInFlight) return;
  if (quiet && appState.busyId) return;
  alertsLoadInFlight = true;
  if (!quiet) {
    setLoading(true);
    hideBanner();
  }
  try {
    const [alertRows, firingRows, tickerOrder] = await Promise.all([
      fetchAlerts(),
      fetchFirings(),
      fetchTickerOrder(),
    ]);
    appState.alerts = alertRows;
    const { order: mergedOrder, changed } = mergeAlertTickersIntoOrder(alertRows, tickerOrder);
    appState.tickerOrder = mergedOrder;
    syncFiringsState(firingRows);
    if (!quiet) {
      appState.quotesLoading = true;
      appState.quotesPending = new Set(
        [...mergedOrder, ...alertRows.map((a) => a.ticker)]
          .map((t) => String(t).toUpperCase())
          .filter(Boolean),
      );
      setLoading(false);
    }
    if (appState.currentView === "firings") renderFirings();
    else renderAlerts();
    if (!quiet) void loadQuotes();
    if (changed && !quiet) {
      try {
        await saveTickerOrder(mergedOrder);
      } catch {
        /* backfill best-effort: el listado ya muestra los tickers */
      }
    }
  } catch (error) {
    if (quiet) return;
    setLoading(false);
    renderAlerts();
    const message = error instanceof Error ? error.message : "Error desconocido";
    showBanner("error", mapDbError(message));
  } finally {
    alertsLoadInFlight = false;
  }
}

function bindVisibilityRefresh() {
  const refreshIfVisible = () => {
    if (document.visibilityState !== "visible") return;
    void loadAlerts({ quiet: true });
  };
  document.addEventListener("visibilitychange", refreshIfVisible);
  window.addEventListener("focus", refreshIfVisible);
}

async function handleTickerReorder(tickers) {
  const previous = [...appState.tickerOrder];
  appState.tickerOrder = tickers;
  renderAlerts();
  hideBanner();
  try {
    await saveTickerOrder(tickers);
  } catch (error) {
    const raw =
      (error && typeof error === "object" && typeof error.message === "string" && error.message) ||
      (error instanceof Error ? error.message : "") ||
      "";
    appState.tickerOrder = previous;
    renderAlerts();
    showBanner("error", mapDbError(raw) || "No se pudo guardar el orden de tickers.");
  }
}

async function handleDeleteFiring(firing) {
  const confirmed = window.confirm(
    `¿Borrar el disparo de ${firing.ticker} (${firing.label})? Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;

  hideBanner();
  try {
    await deleteFiring(firing.id);
    syncFiringsState(appState.firings.filter((f) => f.id !== firing.id));
    renderFirings();
    showBanner("success", `Disparo de ${firing.ticker} borrado.`);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", mapDbError(raw));
  }
}

async function handleVerify(alert) {
  appState.busyId = alert.id;
  renderAlerts();
  hideBanner();
  try {
    const result = await verifyAlert(alert.id);
    const meets = result.conditionMet ? "sí cumple" : "no cumple";
    showBanner(
      "success",
      `Verificación de ${alert.ticker} enviada por correo (cierre ${Number(result.close).toFixed(2)}, ${meets}). No consume cupo diario.`,
    );
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", raw || "No se pudo verificar la alerta.");
  } finally {
    appState.busyId = null;
    renderAlerts();
  }
}

async function handleToggle(alert, active) {
  appState.busyId = alert.id;
  renderAlerts();
  hideBanner();
  try {
    const updated = await setAlertActive(alert.id, active);
    appState.alerts = appState.alerts.map((a) => (a.id === updated.id ? updated : a));
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", mapDbError(raw));
  } finally {
    appState.busyId = null;
    renderAlerts();
  }
}

async function handleDelete(alert) {
  const confirmed = window.confirm(
    `¿Eliminar la alerta de ${alert.ticker} (${alertDisplayLabel(alert)})? Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;

  appState.busyId = alert.id;
  renderAlerts();
  hideBanner();
  try {
    await deleteAlert(alert.id);
    appState.alerts = appState.alerts.filter((a) => a.id !== alert.id);
    try {
      await ensureTickerInOrder(alert.ticker);
    } catch {
      /* conservar ticker en lista local aunque falle el upsert */
      if (!orderHasTicker(appState.tickerOrder, alert.ticker)) {
        appState.tickerOrder = [...appState.tickerOrder, tickerKey(alert.ticker)];
      }
    }
    showBanner("success", `Alerta de ${alert.ticker} eliminada.`);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", mapDbError(raw));
  } finally {
    appState.busyId = null;
    renderAlerts();
  }
}

async function handleRemoveTicker(ticker) {
  const key = tickerKey(ticker);
  const hasAlerts = appState.alerts.some((a) => tickerKey(a.ticker) === key);
  if (hasAlerts) {
    showBanner("error", `Elimina primero las alertas de ${key} antes de quitar el ticker.`);
    return;
  }

  const confirmed = window.confirm(
    `¿Quitar ${key} de tu lista? Podrás volver a añadirlo al crear una alerta.`,
  );
  if (!confirmed) return;

  hideBanner();
  const previous = [...appState.tickerOrder];
  appState.tickerOrder = appState.tickerOrder.filter((t) => tickerKey(t) !== key);
  renderAlerts();
  try {
    await deleteTickerOrder(key);
    showBanner("success", `${key} quitado de la lista.`);
  } catch (error) {
    appState.tickerOrder = previous;
    renderAlerts();
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", mapDbError(raw) || `No se pudo quitar ${key}.`);
  }
}

async function handleSubmit() {
  const payload = validateFormPayload();
  if (!payload) return;

  setSubmitLoading(true);
  els.formError.classList.add("hidden");
  if (appState.editingAlertId) {
    appState.busyId = appState.editingAlertId;
    renderAlerts();
  }
  try {
    if (appState.editingAlertId) {
      const updated = await updateAlert(appState.editingAlertId, payload);
      appState.alerts = appState.alerts.map((a) => (a.id === updated.id ? updated : a));
      showBanner("success", `Alerta de ${updated.ticker} actualizada.`);
    } else {
      const ticker = readCreateTicker();
      const created = await createAlert({ ticker, ...payload });
      appState.alerts = [created, ...appState.alerts].sort((a, b) => a.ticker.localeCompare(b.ticker));
      try {
        await ensureTickerInOrder(ticker);
      } catch {
        if (!orderHasTicker(appState.tickerOrder, ticker)) {
          appState.tickerOrder = [...appState.tickerOrder, tickerKey(ticker)];
        }
      }
      showBanner("success", `Alerta creada para ${ticker}.`);
      void loadQuotes();
    }
    appState.busyId = null;
    renderAlerts();
    setSubmitLoading(false);
    closeModal({ force: true });
  } catch (error) {
    appState.busyId = null;
    renderAlerts();
    const raw =
      (error && typeof error === "object" && typeof error.message === "string" && error.message) ||
      (error instanceof Error ? error.message : "");
    els.formError.textContent = mapDbError(raw);
    els.formError.classList.remove("hidden");
    setSubmitLoading(false);
  }
}

function bindEvents() {
  els.btnNewAlert.addEventListener("click", openCreateModal);
  document.getElementById("btn-empty-create").addEventListener("click", openCreateModal);
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  els.btnFirings.addEventListener("click", () => {
    showFiringsView();
    void loadFirings();
  });
  els.btnBackAlerts.addEventListener("click", () => showAlertsView());
  els.submitBtn.addEventListener("click", () => void handleSubmit());
  els.tabPreset.addEventListener("click", () => setFormMode("preset"));
  els.tabCustom.addEventListener("click", () => setFormMode("custom"));
  for (const tab of [els.tabPreset, els.tabCustom]) {
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const tabs = [els.tabPreset, els.tabCustom];
      const index = tabs.indexOf(tab);
      const next = e.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      setFormMode(next === 0 ? "preset" : "custom");
      tabs[next].focus();
    });
  }
  for (const btn of document.querySelectorAll(".custom-type-btn")) {
    btn.addEventListener("click", () => setCustomType(btn.dataset.customType));
  }
  for (const btn of document.querySelectorAll("#custom-price-level-fields .operator-seg__btn")) {
    btn.addEventListener("click", () => syncPriceLevelOperator(btn.dataset.operator));
  }
  for (const btn of document.querySelectorAll("#price-ma-period-shortcuts .operator-seg__btn")) {
    btn.addEventListener("click", () => applyPriceMaPeriodShortcut(btn.dataset.period));
  }
  els.priceMaPeriod.addEventListener("input", updateTimeframeHint);
  els.priceMaPeriod.addEventListener("change", updateTimeframeHint);
  els.priceMaType.addEventListener("change", updateTimeframeHint);
  els.priceRangeLow.addEventListener("input", updatePriceRangeBand);
  els.priceRangeHigh.addEventListener("input", updatePriceRangeBand);
  els.presetRsiPeriod.addEventListener("input", updatePresetRsiHint);
  els.presetRsiThreshold.addEventListener("input", updatePresetRsiHint);
  els.stochPeriod.addEventListener("input", updateStochHint);
  els.stochThreshold.addEventListener("input", updateStochHint);
  els.stochOperator.addEventListener("change", updateStochHint);
  els.timeframeSelect.addEventListener("change", updateTimeframeHint);
  for (const input of [
    els.emaFast,
    els.emaSlow,
    els.emaDirection,
    els.priceMaDirection,
    els.priceLevelValue,
    els.rsiPeriod,
    els.rsiThreshold,
    els.rsiOperator,
  ]) {
    input.addEventListener("input", updateSignalSummary);
    input.addEventListener("change", updateSignalSummary);
  }
  els.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modalBackdrop.classList.contains("hidden")) closeModal();
  });
  els.tickerInput.addEventListener("input", () => {
    els.tickerInput.value = els.tickerInput.value.toUpperCase();
    els.tickerError.classList.add("hidden");
    els.tickerInput.classList.remove("input-text--error");
    els.tickerPreview.classList.add("hidden");
  });
  els.tickerInput.addEventListener("blur", () => {
    void previewTickerQuote(els.tickerInput.value);
  });
}

async function main() {
  bindAlertRowActions({
    onEdit: openEditModal,
    onToggle: (alert, active) => void handleToggle(alert, active),
    onDelete: (alert) => void handleDelete(alert),
    onVerify: (alert) => void handleVerify(alert),
  });
  bindTickerOrderActions({
    onReorder: (tickers) => void handleTickerReorder(tickers),
  });
  bindEmptyGroupActions({
    onCreate: (ticker) => openCreateModal({ ticker }),
    onRemoveTicker: (ticker) => void handleRemoveTicker(ticker),
  });
  bindFiringRowActions({
    onDelete: (firing) => void handleDeleteFiring(firing),
  });

  initTextSize();
  renderSkeleton();
  renderFiringsSkeleton();
  renderPresetGrid();
  bindEvents();
  bindVisibilityRefresh();
  hideBanner();

  try {
    const config = await loadAppConfig();
    initAlertsApi(config);
    initFiringsApi(config);
    initTickerOrderApi(config);
    await loadAlerts();
  } catch (error) {
    setLoading(false);
    renderAlerts();
    const message = error instanceof Error ? error.message : "Error al iniciar el panel.";
    showBanner("error", message);
  }
}

main();
