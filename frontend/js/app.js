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
import { renderAlerts, bindAlertRowActions, bindTickerOrderActions } from "./alerts-view.js";
import { renderFirings, bindFiringRowActions, updateFiringsBadge } from "./firings-view.js";
import { showAlertsView, showFiringsView } from "./navigation.js";
import { loadQuotes, previewTickerQuote } from "./quotes-controller.js";
import {
  closeModal,
  openCreateModal,
  openEditModal,
  readCreateTicker,
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

function syncFiringsState(list) {
  appState.firings = list;
  appState.firedAlertIds = alertIdsWithFirings(appState.firings);
  updateFiringsBadge();
}

function tickerHasRemainingAlerts(ticker) {
  const key = String(ticker).toUpperCase();
  return appState.alerts.some((a) => String(a.ticker).toUpperCase() === key);
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

async function loadAlerts() {
  setLoading(true);
  hideBanner();
  try {
    const [alertRows, firingRows, tickerOrder] = await Promise.all([
      fetchAlerts(),
      fetchFirings(),
      fetchTickerOrder(),
    ]);
    appState.alerts = alertRows;
    appState.tickerOrder = tickerOrder;
    syncFiringsState(firingRows);
    setLoading(false);
    if (appState.currentView === "firings") renderFirings();
    else renderAlerts();
    void loadQuotes();
  } catch (error) {
    setLoading(false);
    renderAlerts();
    const message = error instanceof Error ? error.message : "Error desconocido";
    showBanner("error", mapDbError(message));
  }
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
    if (!tickerHasRemainingAlerts(alert.ticker)) {
      appState.tickerOrder = appState.tickerOrder.filter(
        (t) => String(t).toUpperCase() !== String(alert.ticker).toUpperCase(),
      );
      try {
        await deleteTickerOrder(alert.ticker);
      } catch {
        /* orden huérfano: no bloquea el borrado de la alerta */
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
    els.priceMaType,
    els.priceMaPeriod,
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
  bindFiringRowActions({
    onDelete: (firing) => void handleDeleteFiring(firing),
  });

  initTextSize();
  renderSkeleton();
  renderFiringsSkeleton();
  renderPresetGrid();
  bindEvents();
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
