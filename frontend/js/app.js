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
import { alertDisplayLabel } from "./alert-labels.js";
import { mapDbError } from "./format.js";
import { showBanner, hideBanner } from "./banner.js";
import { setLoading, setFiringsLoading } from "./loading.js";
import { renderSkeleton, renderFiringsSkeleton } from "./skeletons.js";
import { appState } from "./app-state.js";
import { els } from "./dom.js";
import { renderAlerts, bindAlertRowActions } from "./alerts-view.js";
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
  updateTimeframeHint,
} from "./alert-form.js";
import { renderPresetGrid, updatePresetRsiHint } from "./form-presets.js";
import { validateFormPayload } from "./form-validation.js";

function syncFiringsState(list) {
  appState.firings = list;
  appState.firedAlertIds = alertIdsWithFirings(appState.firings);
  updateFiringsBadge();
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
    const [alertRows, firingRows] = await Promise.all([fetchAlerts(), fetchFirings()]);
    appState.alerts = alertRows;
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
    const raw = error instanceof Error ? error.message : "";
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
  for (const btn of document.querySelectorAll(".operator-seg__btn")) {
    btn.addEventListener("click", () => syncPriceLevelOperator(btn.dataset.operator));
  }
  els.presetRsiPeriod.addEventListener("input", updatePresetRsiHint);
  els.presetRsiThreshold.addEventListener("input", updatePresetRsiHint);
  els.timeframeSelect.addEventListener("change", updateTimeframeHint);
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
    await loadAlerts();
  } catch (error) {
    setLoading(false);
    renderAlerts();
    const message = error instanceof Error ? error.message : "Error al iniciar el panel.";
    showBanner("error", message);
  }
}

main();
