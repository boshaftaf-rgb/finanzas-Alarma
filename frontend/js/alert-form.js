import { isLongEmaCrossPreset, isOscillatorPreset, isStochPreset, presetDefaultTimeframe } from "./presets.js";
import { normalizeTicker } from "./ticker-validation.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import {
  fillPresetRsiFields,
  resetPresetRsiFields,
  selectPreset,
} from "./form-presets.js";
import { updateSignalSummary } from "./signal-summary.js";

export function setFormMode(mode) {
  appState.formMode = mode;
  const isPreset = mode === "preset";
  els.tabPreset.classList.toggle("is-active", isPreset);
  els.tabCustom.classList.toggle("is-active", !isPreset);
  els.tabPreset.setAttribute("aria-selected", String(isPreset));
  els.tabCustom.setAttribute("aria-selected", String(!isPreset));
  els.presetSection.classList.toggle("hidden", !isPreset);
  els.customSection.classList.toggle("hidden", isPreset);
  updateTimeframeHint();
  els.formError.classList.add("hidden");
  updateSignalSummary();
}

export function setCustomType(type) {
  appState.customType = type;
  const blocksByType = {
    ema: els.customEmaFields,
    price_ma: els.customPriceMaFields,
    price_level: els.customPriceLevelFields,
    price_range: els.customPriceRangeFields,
    rsi: els.customRsiFields,
    stochastic: els.customStochFields,
  };
  const fieldBlocks = Object.values(blocksByType);
  for (const block of fieldBlocks) {
    block.classList.remove("is-enter");
    block.classList.add("hidden");
  }
  const activeBlock = blocksByType[type] ?? els.customRsiFields;
  activeBlock.classList.remove("hidden");
  // Force reflow so enter animation replays on each tab change.
  void activeBlock.offsetWidth;
  activeBlock.classList.add("is-enter");
  for (const btn of document.querySelectorAll(".custom-type-btn")) {
    const active = btn.dataset.customType === type;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  els.timeframeSelect.value = "1day";
  if (type === "stochastic") updateStochHint();
  els.formError.classList.add("hidden");
  updateTimeframeHint();
  updateSignalSummary();
}

export function syncPriceLevelOperator(operator) {
  const value = operator === "<=" ? "<=" : ">=";
  els.priceLevelOperator.value = value;
  for (const btn of document.querySelectorAll("#custom-price-level-fields .operator-seg__btn")) {
    const active = btn.dataset.operator === value;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  }
  updateSignalSummary();
}

export function updatePriceRangeBand() {
  const low = els.priceRangeLow.value.trim() || "—";
  const high = els.priceRangeHigh.value.trim() || "—";
  if (els.rangeBandLow) els.rangeBandLow.textContent = low;
  if (els.rangeBandHigh) els.rangeBandHigh.textContent = high;
  updateSignalSummary();
}

export function updateStochHint() {
  if (!els.stochHint) return;
  const period = Number(els.stochPeriod.value) || 7;
  const threshold = Number(els.stochThreshold.value);
  const thresholdText = Number.isFinite(threshold) ? threshold : 20;
  const oversold = els.stochOperator.value !== ">";
  const opLabel = oversold ? "menor que" : "mayor que";
  const zone = oversold
    ? "zona de sobreventa (posible rebote)"
    : "zona de sobrecompra (posible recorte)";
  els.stochHint.textContent = `Stoch de ${period} días ${opLabel} ${thresholdText} → ${zone}`;
  updateSignalSummary();
}

export function updateTimeframeHint() {
  els.timeframeSelect.value = "1day";
  els.timeframeSelect.disabled = true;
  if (appState.formMode === "preset") {
    if (isStochPreset(appState.selectedPreset)) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. Stoch: período 7 = últimos 7 días (gráfico 1Y).";
    } else if (isOscillatorPreset(appState.selectedPreset)) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. RSI: período 14 = últimos 14 días (gráfico 1Y).";
    } else if (isLongEmaCrossPreset(appState.selectedPreset)) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. Golden/Death: EMA(50)/EMA(200) como en gráfico 1Y.";
    } else if (appState.selectedPreset) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. Impulso EMA(9)/EMA(21) en diario (vista 1Y).";
    } else {
      els.timeframeHint.textContent =
        "Todas las alertas se evalúan con velas diarias (como gráfico 1Y / intervalo 1 día).";
    }
  } else if (appState.customType === "price_ma") {
    els.timeframeHint.textContent =
      "Diario: período 12 = media de 12 días (como gráfico 1Y en TradingView).";
  } else if (appState.customType === "stochastic") {
    els.timeframeHint.textContent =
      "Diario: Stoch(7) usa el rango high–low de los últimos 7 días.";
  } else {
    els.timeframeHint.textContent =
      "Todas las alertas se evalúan con velas diarias (como gráfico 1Y / intervalo 1 día).";
  }
  updateSignalSummary();
}

export function resetCustomFields() {
  els.emaFast.value = "9";
  els.emaSlow.value = "21";
  els.emaDirection.value = "up";
  els.priceMaType.value = "sma";
  els.priceMaPeriod.value = "12";
  els.priceMaDirection.value = "up";
  els.priceLevelValue.value = "100";
  syncPriceLevelOperator(">=");
  els.priceRangeLow.value = "100";
  els.priceRangeHigh.value = "120";
  updatePriceRangeBand();
  els.rsiPeriod.value = "14";
  els.rsiThreshold.value = "30";
  els.rsiOperator.value = "<";
  els.stochPeriod.value = "7";
  els.stochThreshold.value = "20";
  els.stochOperator.value = "<";
  els.timeframeSelect.value = "1day";
  els.timeframeSelect.disabled = true;
  setCustomType("ema");
}

export function fillCustomFields(params) {
  if (params?.type === "rsi") {
    setCustomType("rsi");
    els.rsiPeriod.value = String(params.period ?? 14);
    els.rsiThreshold.value = String(params.threshold ?? 30);
    els.rsiOperator.value = params.operator === ">" ? ">" : "<";
    return;
  }
  if (params?.type === "stochastic") {
    setCustomType("stochastic");
    els.stochPeriod.value = String(params.period ?? 7);
    els.stochThreshold.value = String(params.threshold ?? 20);
    els.stochOperator.value = params.operator === ">" ? ">" : "<";
    updateStochHint();
    return;
  }
  if (params?.type === "price_ma") {
    setCustomType("price_ma");
    els.priceMaType.value = params.ma_type === "ema" ? "ema" : "sma";
    els.priceMaPeriod.value = String(params.period ?? 12);
    els.priceMaDirection.value = params.direction === "down" ? "down" : "up";
    return;
  }
  if (params?.type === "price_level") {
    setCustomType("price_level");
    els.priceLevelValue.value = String(params.level ?? 100);
    syncPriceLevelOperator(params.operator === "<=" ? "<=" : ">=");
    return;
  }
  if (params?.type === "price_range") {
    setCustomType("price_range");
    els.priceRangeLow.value = String(params.low ?? 100);
    els.priceRangeHigh.value = String(params.high ?? 120);
    updatePriceRangeBand();
    return;
  }
  setCustomType("ema");
  els.emaFast.value = String(params?.ema_fast ?? 9);
  els.emaSlow.value = String(params?.ema_slow ?? 21);
  els.emaDirection.value = params?.direction === "down" ? "down" : "up";
}

export function setSubmitLoading(loading) {
  els.submitBtn.disabled = loading;
  els.submitBtn.classList.toggle("is-loading", loading);
  els.submitBtn.setAttribute("aria-busy", String(loading));
  document.getElementById("btn-cancel").disabled = loading;
}

export function resetForm() {
  appState.editingAlertId = null;
  appState.selectedPreset = null;
  appState.formMode = "preset";
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
  updateSignalSummary();
}

export function openCreateModal() {
  resetForm();
  els.modalBackdrop.classList.remove("hidden");
  els.tickerInput.focus();
}

export function openEditModal(alert) {
  resetForm();
  appState.editingAlertId = alert.id;
  els.formTitle.textContent = "Editar alerta";
  els.submitLabel.textContent = "Guardar cambios";
  els.tickerInput.value = alert.ticker;
  els.tickerInput.disabled = true;

  if (alert.preset_or_custom === "custom") {
    setFormMode("custom");
    els.timeframeSelect.value = "1day";
    fillCustomFields(alert.params);
  } else {
    setFormMode("preset");
    selectPreset(alert.preset_or_custom);
    els.timeframeSelect.value = presetDefaultTimeframe(alert.preset_or_custom);
    if (isOscillatorPreset(alert.preset_or_custom)) {
      fillPresetRsiFields(alert.preset_or_custom, alert.params);
    }
  }

  updateTimeframeHint();
  updateSignalSummary();
  els.modalBackdrop.classList.remove("hidden");
  if (appState.formMode === "preset") {
    els.presetGrid.querySelector(".is-selected")?.focus();
    return;
  }
  const focusByType = {
    rsi: els.rsiPeriod,
    stochastic: els.stochPeriod,
    price_ma: els.priceMaPeriod,
    price_level: els.priceLevelValue,
    price_range: els.priceRangeLow,
    ema: els.emaFast,
  };
  (focusByType[appState.customType] ?? els.emaFast).focus();
}

export function closeModal({ force = false } = {}) {
  if (!force && els.submitBtn.classList.contains("is-loading")) return;
  els.modalBackdrop.classList.add("hidden");
  resetForm();
}

export function readCreateTicker() {
  return normalizeTicker(els.tickerInput.value);
}
