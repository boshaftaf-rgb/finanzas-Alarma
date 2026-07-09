import { initTextSize } from "./text-size.js";
import { loadAppConfig } from "./config.js";
import {
  countUniqueActiveTickers,
  createAlert,
  deleteAlert,
  fetchAlerts,
  initAlertsApi,
  setAlertActive,
  updateAlert,
} from "./alerts-api.js";
import { alertBadge, alertDisplayLabel, alertKind } from "./alert-labels.js";
import {
  buildEmaParams,
  buildRsiParams,
  buildRsiPresetParams,
  validateEmaParams,
  validateRsiParams,
  validateRsiPresetParams,
} from "./custom-params.js";
import { formatEvaluatedAt, formatPercentChange, formatPrice, formatVolume, mapDbError } from "./format.js";
import { fetchTickerQuotes } from "./quotes-api.js";
import { MAX_UNIQUE_TICKERS, PRESETS, isRsiPreset, rsiPresetDefaults } from "./presets.js";
import { normalizeTicker, validateTicker } from "./ticker-validation.js";

const els = {
  banner: document.getElementById("banner"),
  tickerCounter: document.getElementById("ticker-counter"),
  skeleton: document.getElementById("skeleton"),
  emptyState: document.getElementById("empty-state"),
  alertList: document.getElementById("alert-list"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  formTitle: document.getElementById("alert-form-title"),
  tickerInput: document.getElementById("ticker-input"),
  tickerError: document.getElementById("ticker-error"),
  formError: document.getElementById("form-error"),
  presetGrid: document.getElementById("preset-grid"),
  presetSection: document.getElementById("preset-section"),
  presetRsiFields: document.getElementById("preset-rsi-fields"),
  presetRsiPeriod: document.getElementById("preset-rsi-period"),
  presetRsiThreshold: document.getElementById("preset-rsi-threshold"),
  presetRsiHint: document.getElementById("preset-rsi-hint"),
  customSection: document.getElementById("custom-section"),
  tabPreset: document.getElementById("tab-preset"),
  tabCustom: document.getElementById("tab-custom"),
  customEmaFields: document.getElementById("custom-ema-fields"),
  customRsiFields: document.getElementById("custom-rsi-fields"),
  emaFast: document.getElementById("ema-fast"),
  emaSlow: document.getElementById("ema-slow"),
  emaDirection: document.getElementById("ema-direction"),
  rsiPeriod: document.getElementById("rsi-period"),
  rsiThreshold: document.getElementById("rsi-threshold"),
  rsiOperator: document.getElementById("rsi-operator"),
  submitBtn: document.getElementById("submit-alert"),
  submitLabel: document.getElementById("submit-alert-label"),
  tickerPreview: document.getElementById("ticker-preview"),
};

let alerts = [];
let busyId = null;
let selectedPreset = null;
let quotesByTicker = {};
let quotesLoading = false;
let editingAlertId = null;
let formMode = "preset";
let customType = "ema";

function showBanner(type, text) {
  els.banner.className = `alert-banner alert-banner--${type}`;
  els.banner.textContent = text;
  els.banner.classList.remove("hidden");
}

function hideBanner() {
  els.banner.classList.add("hidden");
}

function setLoading(isLoading) {
  els.skeleton.classList.toggle("hidden", !isLoading);
  els.alertList.classList.toggle("hidden", isLoading);
  els.emptyState.classList.add("hidden");
  if (isLoading) els.skeleton.setAttribute("aria-busy", "true");
  else els.skeleton.removeAttribute("aria-busy");
}

function updateTickerCounter() {
  const count = countUniqueActiveTickers(alerts);
  els.tickerCounter.textContent = `${count} / ${MAX_UNIQUE_TICKERS} tickers activos`;
  els.tickerCounter.classList.toggle("ticker-counter--warning", count >= MAX_UNIQUE_TICKERS);
}

function renderSkeleton() {
  els.skeleton.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const row = document.createElement("div");
    row.className = "skeleton-row";
    row.setAttribute("aria-hidden", "true");
    row.innerHTML = alertRowSkeletonHtml();
    els.skeleton.appendChild(row);
  }
}

function alertRowSkeletonHtml() {
  return `
    <div class="alert-row__symbol">
      <div class="skeleton skeleton-row__ticker"></div>
      <div class="skeleton quote-skeleton"></div>
    </div>
    <div>
      <div class="skeleton skeleton-row__label"></div>
      <div class="skeleton skeleton-row__meta"></div>
    </div>
    <div class="skeleton skeleton-row__badge"></div>
    <div class="alert-row__actions">
      <div class="skeleton skeleton-row__action"></div>
      <div class="skeleton skeleton-row__action skeleton-row__action--sm"></div>
      <div class="skeleton skeleton-row__action"></div>
    </div>
  `;
}

function quoteChangeClass(percentChange) {
  if (percentChange > 0) return "up";
  if (percentChange < 0) return "down";
  return "flat";
}

function quoteBlockHtml(ticker, { compact = false } = {}) {
  const quote = quotesByTicker[ticker.toUpperCase()];
  if (quotesLoading && !quote) {
    return `<div class="alert-row__quote" aria-busy="true"><span class="skeleton quote-skeleton"></span></div>`;
  }
  if (!quote) {
    return `<div class="alert-row__quote alert-row__quote--muted">Sin cotización</div>`;
  }

  const dir = quoteChangeClass(quote.percentChange);
  const volume = formatVolume(quote.volume);
  const volumeHtml = !compact && volume ? `<span class="quote-volume">Vol. ${volume}</span>` : "";

  return `
    <div class="alert-row__quote">
      <span class="quote-price">${formatPrice(quote.price)}</span>
      <span class="quote-change quote-change--${dir}">${formatPercentChange(quote.percentChange)}</span>
      ${volumeHtml}
    </div>
    ${!compact && quote.name ? `<div class="alert-row__company" title="${quote.name}">${quote.name}</div>` : ""}
  `;
}

function renderTickerPreview(ticker) {
  const quote = quotesByTicker[ticker.toUpperCase()];
  if (!quote) {
    els.tickerPreview.classList.add("hidden");
    els.tickerPreview.innerHTML = "";
    return;
  }

  const dir = quoteChangeClass(quote.percentChange);
  els.tickerPreview.classList.remove("hidden");
  els.tickerPreview.innerHTML = `
    <div class="ticker-preview__row">
      <span class="ticker-preview__price">${formatPrice(quote.price)}</span>
      <span class="quote-change quote-change--${dir}">${formatPercentChange(quote.percentChange)}</span>
    </div>
    ${quote.name ? `<p class="ticker-preview__name">${quote.name}</p>` : ""}
  `;
}

async function loadQuotes(tickers = null) {
  const list = tickers ?? [...new Set(alerts.map((a) => a.ticker))];
  if (list.length === 0) {
    quotesByTicker = {};
    return;
  }

  quotesLoading = true;
  renderAlerts();

  const raw = await fetchTickerQuotes(list);
  quotesByTicker = {};
  for (const [key, value] of Object.entries(raw.quotes)) {
    quotesByTicker[key.toUpperCase()] = value;
  }

  quotesLoading = false;
  if (raw.error && Object.keys(raw.quotes).length === 0) {
    showBanner("error", raw.error);
  }
  renderAlerts();
}

async function previewTickerQuote(rawTicker) {
  const error = validateTicker(rawTicker);
  if (error) {
    els.tickerPreview.classList.add("hidden");
    return;
  }

  const ticker = normalizeTicker(rawTicker);
  els.tickerPreview.classList.remove("hidden");
  els.tickerPreview.innerHTML = `<span class="skeleton quote-skeleton" aria-busy="true"></span>`;

  const raw = await fetchTickerQuotes([ticker]);
  const quote = raw.quotes[ticker];
  if (quote) {
    quotesByTicker[ticker] = quote;
    renderTickerPreview(ticker);
  } else {
    els.tickerPreview.classList.add("hidden");
  }
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function badgeHtml(variant, text) {
  return `<span class="badge badge--${variant}">${text}</span>`;
}

function renderAlerts() {
  updateTickerCounter();
  els.alertList.innerHTML = "";

  if (alerts.length === 0) {
    els.alertList.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.alertList.classList.remove("hidden");

  for (const alert of alerts) {
    if (busyId === alert.id) {
      const row = document.createElement("article");
      row.className = "alert-row alert-row--busy";
      row.dataset.id = alert.id;
      row.setAttribute("aria-busy", "true");
      row.setAttribute("aria-label", `Actualizando alerta ${alert.ticker}`);
      row.innerHTML = alertRowSkeletonHtml();
      els.alertList.appendChild(row);
      continue;
    }

    const label = alertDisplayLabel(alert);
    const kind = alertKind(alert);
    const badgeText = alertBadge(alert);
    const kindBadge =
      kind === "ema" ? badgeHtml("ema", badgeText) : kind === "rsi" ? badgeHtml("rsi", badgeText) : "";

    const row = document.createElement("article");
    row.className = `alert-row ${alert.active ? "" : "alert-row--inactive"}`.trim();
    row.dataset.id = alert.id;
    row.innerHTML = `
      <div class="alert-row__symbol">
        <div class="alert-row__ticker">${alert.ticker}</div>
        ${quoteBlockHtml(alert.ticker)}
      </div>
      <div>
        <div class="alert-row__preset">
          <span class="alert-row__preset-label alert-row__preset-label--truncate" title="${escapeAttr(label)}">${label}</span>
          ${kindBadge}
        </div>
        <div class="alert-row__meta">Última evaluación: ${formatEvaluatedAt(alert.last_evaluated_at)}</div>
      </div>
      ${badgeHtml(alert.active ? "active" : "inactive", alert.active ? "Activa" : "Inactiva")}
      <div class="alert-row__actions">
        <button type="button" class="btn-ghost btn-ghost--accent btn-edit" aria-label="Editar alerta ${alert.ticker}">Editar</button>
        <button type="button" class="toggle" role="switch" aria-checked="${alert.active}" aria-label="${alert.active ? "Desactivar" : "Activar"} alerta ${alert.ticker}">
          <span class="toggle__thumb"></span>
        </button>
        <button type="button" class="btn-ghost btn-delete" aria-label="Eliminar alerta ${alert.ticker}">Eliminar</button>
      </div>
    `;

    const toggle = row.querySelector(".toggle");
    const editBtn = row.querySelector(".btn-edit");
    const deleteBtn = row.querySelector(".btn-delete");

    editBtn.addEventListener("click", () => openEditModal(alert));
    toggle.addEventListener("click", () => void handleToggle(alert, !alert.active));
    deleteBtn.addEventListener("click", () => void handleDelete(alert));

    els.alertList.appendChild(row);
  }
}

async function loadAlerts() {
  setLoading(true);
  hideBanner();
  try {
    alerts = await fetchAlerts();
    setLoading(false);
    renderAlerts();
    void loadQuotes();
  } catch (error) {
    setLoading(false);
    const message = error instanceof Error ? error.message : "Error desconocido";
    showBanner("error", mapDbError(message));
  }
}

async function handleToggle(alert, active) {
  busyId = alert.id;
  renderAlerts();
  hideBanner();
  try {
    const updated = await setAlertActive(alert.id, active);
    alerts = alerts.map((a) => (a.id === updated.id ? updated : a));
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", mapDbError(raw));
  } finally {
    busyId = null;
    renderAlerts();
  }
}

async function handleDelete(alert) {
  const confirmed = window.confirm(
    `¿Eliminar la alerta de ${alert.ticker} (${alertDisplayLabel(alert)})? Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;

  busyId = alert.id;
  renderAlerts();
  hideBanner();
  try {
    await deleteAlert(alert.id);
    alerts = alerts.filter((a) => a.id !== alert.id);
    showBanner("success", `Alerta de ${alert.ticker} eliminada.`);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    showBanner("error", mapDbError(raw));
  } finally {
    busyId = null;
    renderAlerts();
  }
}

function renderPresetGrid() {
  els.presetGrid.innerHTML = "";
  for (const preset of PRESETS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "preset-card";
    card.dataset.presetId = preset.id;
    card.setAttribute("role", "option");
    card.setAttribute("aria-selected", "false");
    card.innerHTML = `
      <span class="preset-card__name">${preset.name}</span>
      <span class="preset-card__desc">${preset.description}</span>
      ${badgeHtml(preset.kind === "ema" ? "ema" : "rsi", preset.badge)}
    `;
    card.addEventListener("click", () => selectPreset(preset.id));
    els.presetGrid.appendChild(card);
  }
}

function selectPreset(id) {
  selectedPreset = id;
  els.formError.classList.add("hidden");
  for (const card of els.presetGrid.querySelectorAll(".preset-card")) {
    const isSelected = card.dataset.presetId === id;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-selected", String(isSelected));
  }
  if (isRsiPreset(id)) {
    const defaults = rsiPresetDefaults(id);
    els.presetRsiPeriod.value = String(defaults.period);
    els.presetRsiThreshold.value = String(defaults.threshold);
    els.presetRsiFields.classList.remove("hidden");
    updatePresetRsiHint();
  } else {
    els.presetRsiFields.classList.add("hidden");
  }
}

function updatePresetRsiHint() {
  if (!selectedPreset || !isRsiPreset(selectedPreset)) return;
  const defaults = rsiPresetDefaults(selectedPreset);
  const period = Number(els.presetRsiPeriod.value) || defaults.period;
  const threshold = Number(els.presetRsiThreshold.value);
  const thresholdText = Number.isFinite(threshold) ? threshold : defaults.threshold;
  const opLabel = defaults.operator === ">" ? "mayor que" : "menor que";
  els.presetRsiHint.textContent = `RSI(${period}) ${opLabel} ${thresholdText}`;
}

function fillPresetRsiFields(presetId, params) {
  const defaults = rsiPresetDefaults(presetId);
  if (!defaults) return;
  els.presetRsiPeriod.value = String(params?.period ?? defaults.period);
  els.presetRsiThreshold.value = String(params?.threshold ?? defaults.threshold);
  updatePresetRsiHint();
}

function resetPresetRsiFields() {
  els.presetRsiPeriod.value = "14";
  els.presetRsiThreshold.value = "30";
  els.presetRsiFields.classList.add("hidden");
  els.presetRsiHint.textContent = "RSI(14) menor que 30";
}

function setFormMode(mode) {
  formMode = mode;
  const isPreset = mode === "preset";
  els.tabPreset.classList.toggle("is-active", isPreset);
  els.tabCustom.classList.toggle("is-active", !isPreset);
  els.tabPreset.setAttribute("aria-selected", String(isPreset));
  els.tabCustom.setAttribute("aria-selected", String(!isPreset));
  els.presetSection.classList.toggle("hidden", !isPreset);
  els.customSection.classList.toggle("hidden", isPreset);
  els.formError.classList.add("hidden");
}

function setCustomType(type) {
  customType = type;
  const isEma = type === "ema";
  els.customEmaFields.classList.toggle("hidden", !isEma);
  els.customRsiFields.classList.toggle("hidden", isEma);
  for (const btn of document.querySelectorAll(".custom-type-btn")) {
    const active = btn.dataset.customType === type;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  els.formError.classList.add("hidden");
}

function resetCustomFields() {
  els.emaFast.value = "9";
  els.emaSlow.value = "21";
  els.emaDirection.value = "up";
  els.rsiPeriod.value = "14";
  els.rsiThreshold.value = "30";
  els.rsiOperator.value = "<";
  setCustomType("ema");
}

function fillCustomFields(params) {
  if (params?.type === "rsi") {
    setCustomType("rsi");
    els.rsiPeriod.value = String(params.period ?? 14);
    els.rsiThreshold.value = String(params.threshold ?? 30);
    els.rsiOperator.value = params.operator === ">" ? ">" : "<";
    return;
  }
  setCustomType("ema");
  els.emaFast.value = String(params?.ema_fast ?? 9);
  els.emaSlow.value = String(params?.ema_slow ?? 21);
  els.emaDirection.value = params?.direction === "down" ? "down" : "up";
}

function resetForm() {
  editingAlertId = null;
  selectedPreset = null;
  formMode = "preset";
  els.formTitle.textContent = "Nueva alerta";
  els.submitLabel.textContent = "Crear alerta";
  els.tickerInput.value = "";
  els.tickerInput.disabled = false;
  els.tickerInput.classList.remove("input-text--error");
  els.tickerError.classList.add("hidden");
  els.formError.classList.add("hidden");
  els.tickerPreview.classList.add("hidden");
  els.tickerPreview.innerHTML = "";
  els.tabPreset.disabled = false;
  els.tabCustom.disabled = false;
  for (const card of els.presetGrid.querySelectorAll(".preset-card")) {
    card.classList.remove("is-selected");
    card.setAttribute("aria-selected", "false");
  }
  resetPresetRsiFields();
  resetCustomFields();
  setFormMode("preset");
  setSubmitLoading(false);
}

function openCreateModal() {
  resetForm();
  els.modalBackdrop.classList.remove("hidden");
  els.tickerInput.focus();
}

function openEditModal(alert) {
  resetForm();
  editingAlertId = alert.id;
  els.formTitle.textContent = "Editar alerta";
  els.submitLabel.textContent = "Guardar cambios";
  els.tickerInput.value = alert.ticker;
  els.tickerInput.disabled = true;

  if (alert.preset_or_custom === "custom") {
    setFormMode("custom");
    fillCustomFields(alert.params);
  } else {
    setFormMode("preset");
    selectPreset(alert.preset_or_custom);
    if (isRsiPreset(alert.preset_or_custom)) {
      fillPresetRsiFields(alert.preset_or_custom, alert.params);
    }
  }

  els.modalBackdrop.classList.remove("hidden");
  if (formMode === "preset") {
    els.presetGrid.querySelector(".is-selected")?.focus();
  } else {
    (customType === "ema" ? els.emaFast : els.rsiPeriod).focus();
  }
}

function closeModal({ force = false } = {}) {
  if (!force && els.submitBtn.classList.contains("is-loading")) return;
  els.modalBackdrop.classList.add("hidden");
  resetForm();
}

function setSubmitLoading(loading) {
  els.submitBtn.disabled = loading;
  els.submitBtn.classList.toggle("is-loading", loading);
  els.submitBtn.setAttribute("aria-busy", String(loading));
  document.getElementById("btn-cancel").disabled = loading;
}

function validateFormPayload() {
  if (!editingAlertId) {
    const tickerValidation = validateTicker(els.tickerInput.value);
    if (tickerValidation) {
      els.tickerInput.classList.add("input-text--error");
      els.tickerError.textContent = tickerValidation;
      els.tickerError.classList.remove("hidden");
      return null;
    }
    els.tickerInput.classList.remove("input-text--error");
    els.tickerError.classList.add("hidden");
  }

  if (formMode === "preset") {
    if (!selectedPreset) {
      els.formError.textContent = "Selecciona una alerta predefinida.";
      els.formError.classList.remove("hidden");
      return null;
    }
    if (isRsiPreset(selectedPreset)) {
      const error = validateRsiPresetParams(els.presetRsiPeriod.value, els.presetRsiThreshold.value);
      if (error) {
        els.formError.textContent = error;
        els.formError.classList.remove("hidden");
        return null;
      }
      return {
        presetOrCustom: selectedPreset,
        params: buildRsiPresetParams(els.presetRsiPeriod.value, els.presetRsiThreshold.value),
      };
    }
    return {
      presetOrCustom: selectedPreset,
      params: {},
    };
  }

  if (customType === "ema") {
    const error = validateEmaParams(els.emaFast.value, els.emaSlow.value, els.emaDirection.value);
    if (error) {
      els.formError.textContent = error;
      els.formError.classList.remove("hidden");
      return null;
    }
    return {
      presetOrCustom: "custom",
      params: buildEmaParams(els.emaFast.value, els.emaSlow.value, els.emaDirection.value),
    };
  }

  const error = validateRsiParams(els.rsiPeriod.value, els.rsiThreshold.value, els.rsiOperator.value);
  if (error) {
    els.formError.textContent = error;
    els.formError.classList.remove("hidden");
    return null;
  }
  return {
    presetOrCustom: "custom",
    params: buildRsiParams(els.rsiPeriod.value, els.rsiThreshold.value, els.rsiOperator.value),
  };
}

async function handleSubmit() {
  const payload = validateFormPayload();
  if (!payload) return;

  setSubmitLoading(true);
  els.formError.classList.add("hidden");
  if (editingAlertId) {
    busyId = editingAlertId;
    renderAlerts();
  }
  try {
    if (editingAlertId) {
      const updated = await updateAlert(editingAlertId, payload);
      alerts = alerts.map((a) => (a.id === updated.id ? updated : a));
      showBanner("success", `Alerta de ${updated.ticker} actualizada.`);
    } else {
      const ticker = normalizeTicker(els.tickerInput.value);
      const created = await createAlert({ ticker, ...payload });
      alerts = [created, ...alerts].sort((a, b) => a.ticker.localeCompare(b.ticker));
      showBanner("success", `Alerta creada para ${ticker}.`);
      void loadQuotes();
    }
    busyId = null;
    renderAlerts();
    setSubmitLoading(false);
    closeModal({ force: true });
  } catch (error) {
    busyId = null;
    renderAlerts();
    const raw = error instanceof Error ? error.message : "";
    els.formError.textContent = mapDbError(raw);
    els.formError.classList.remove("hidden");
    setSubmitLoading(false);
  }
}

function bindEvents() {
  document.getElementById("btn-new-alert").addEventListener("click", openCreateModal);
  document.getElementById("btn-empty-create").addEventListener("click", openCreateModal);
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
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
  els.presetRsiPeriod.addEventListener("input", updatePresetRsiHint);
  els.presetRsiThreshold.addEventListener("input", updatePresetRsiHint);
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
  initTextSize();
  renderSkeleton();
  renderPresetGrid();
  bindEvents();
  hideBanner();

  try {
    const config = await loadAppConfig();
    initAlertsApi(config);
    await loadAlerts();
  } catch (error) {
    setLoading(false);
    const message = error instanceof Error ? error.message : "Error al iniciar el panel.";
    showBanner("error", message);
  }
}

main();
