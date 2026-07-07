import { loadAppConfig } from "./config.js";
import {
  countUniqueActiveTickers,
  createAlert,
  deleteAlert,
  fetchAlerts,
  initAlertsApi,
  setAlertActive,
} from "./alerts-api.js";
import { formatEvaluatedAt, formatPercentChange, formatPrice, formatVolume, mapDbError } from "./format.js";
import { fetchTickerQuotes } from "./quotes-api.js";
import { MAX_UNIQUE_TICKERS, PRESETS, presetBadge, presetKind, presetLabel } from "./presets.js";
import { normalizeTicker, validateTicker } from "./ticker-validation.js";

const els = {
  banner: document.getElementById("banner"),
  tickerCounter: document.getElementById("ticker-counter"),
  skeleton: document.getElementById("skeleton"),
  emptyState: document.getElementById("empty-state"),
  alertList: document.getElementById("alert-list"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  tickerInput: document.getElementById("ticker-input"),
  tickerError: document.getElementById("ticker-error"),
  formError: document.getElementById("form-error"),
  presetGrid: document.getElementById("preset-grid"),
  submitBtn: document.getElementById("submit-alert"),
  tickerPreview: document.getElementById("ticker-preview"),
};

let alerts = [];
let busyId = null;
let selectedPreset = null;
let quotesByTicker = {};
let quotesLoading = false;

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
    row.innerHTML = `
      <div class="skeleton skeleton-row__ticker"></div>
      <div class="skeleton skeleton-row__label"></div>
      <div class="skeleton quote-skeleton"></div>
      <div class="skeleton skeleton-row__badge"></div>
      <div class="skeleton skeleton-row__action"></div>
    `;
    els.skeleton.appendChild(row);
  }
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
  const volumeHtml =
    !compact && volume ? `<span class="quote-volume">Vol. ${volume}</span>` : "";

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
    const kind = presetKind(alert.preset_or_custom);
    const badgeText = presetBadge(alert.preset_or_custom);
    const kindBadge =
      kind === "ema"
        ? badgeHtml("ema", badgeText)
        : kind === "rsi"
          ? badgeHtml("rsi", badgeText)
          : "";

    const row = document.createElement("article");
    row.className = `alert-row ${alert.active ? "" : "alert-row--inactive"}`.trim();
    row.dataset.id = alert.id;
    row.innerHTML = `
      <div class="alert-row__symbol">
        <div class="alert-row__ticker">${alert.ticker}</div>
        ${quoteBlockHtml(alert.ticker)}
      </div>
      <div>
        <div class="alert-row__preset">${presetLabel(alert.preset_or_custom)} ${kindBadge}</div>
        <div class="alert-row__meta">Última evaluación: ${formatEvaluatedAt(alert.last_evaluated_at)}</div>
      </div>
      ${badgeHtml(alert.active ? "active" : "inactive", alert.active ? "Activa" : "Inactiva")}
      <div class="alert-row__actions">
        <button type="button" class="toggle" role="switch" aria-checked="${alert.active}" aria-label="${alert.active ? "Desactivar" : "Activar"} alerta ${alert.ticker}">
          <span class="toggle__thumb"></span>
        </button>
        <button type="button" class="btn-ghost btn-delete" aria-label="Eliminar alerta ${alert.ticker}">Eliminar</button>
      </div>
    `;

    const toggle = row.querySelector(".toggle");
    const deleteBtn = row.querySelector(".btn-delete");
    const disabled = busyId === alert.id;

    toggle.disabled = disabled;
    deleteBtn.disabled = disabled;

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
    `¿Eliminar la alerta de ${alert.ticker} (${presetLabel(alert.preset_or_custom)})? Esta acción no se puede deshacer.`,
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
}

function openModal() {
  selectedPreset = null;
  els.tickerInput.value = "";
  els.tickerInput.classList.remove("input-text--error");
  els.tickerError.classList.add("hidden");
  els.formError.classList.add("hidden");
  els.tickerPreview.classList.add("hidden");
  els.tickerPreview.innerHTML = "";
  for (const card of els.presetGrid.querySelectorAll(".preset-card")) {
    card.classList.remove("is-selected");
    card.setAttribute("aria-selected", "false");
  }
  setSubmitLoading(false);
  els.modalBackdrop.classList.remove("hidden");
  els.tickerInput.focus();
}

function closeModal() {
  if (els.submitBtn.classList.contains("is-loading")) return;
  els.modalBackdrop.classList.add("hidden");
}

function setSubmitLoading(loading) {
  els.submitBtn.disabled = loading;
  els.submitBtn.classList.toggle("is-loading", loading);
  els.submitBtn.setAttribute("aria-busy", String(loading));
}

async function handleSubmit() {
  const tickerValidation = validateTicker(els.tickerInput.value);
  if (tickerValidation) {
    els.tickerInput.classList.add("input-text--error");
    els.tickerError.textContent = tickerValidation;
    els.tickerError.classList.remove("hidden");
    return;
  }
  els.tickerInput.classList.remove("input-text--error");
  els.tickerError.classList.add("hidden");

  if (!selectedPreset) {
    els.formError.textContent = "Selecciona un preset de alerta.";
    els.formError.classList.remove("hidden");
    return;
  }

  setSubmitLoading(true);
  els.formError.classList.add("hidden");
  try {
    const ticker = normalizeTicker(els.tickerInput.value);
    const created = await createAlert(ticker, selectedPreset);
    alerts = [created, ...alerts].sort((a, b) => a.ticker.localeCompare(b.ticker));
    renderAlerts();
    void loadQuotes();
    showBanner("success", `Alerta creada para ${ticker}.`);
    closeModal();
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    els.formError.textContent = mapDbError(raw);
    els.formError.classList.remove("hidden");
  } finally {
    setSubmitLoading(false);
  }
}

function bindEvents() {
  document.getElementById("btn-new-alert").addEventListener("click", openModal);
  document.getElementById("btn-empty-create").addEventListener("click", openModal);
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  els.submitBtn.addEventListener("click", () => void handleSubmit());
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
