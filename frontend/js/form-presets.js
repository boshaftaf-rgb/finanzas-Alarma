import {
  PRESETS,
  isOscillatorPreset,
  isStochPreset,
  oscillatorPresetDefaults,
} from "./presets.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { badgeHtml } from "./html-utils.js";

export function renderPresetGrid() {
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

function syncPresetFieldLabels(id) {
  if (!els.presetRsiPeriodLabel || !els.presetRsiThresholdLabel) return;
  if (isStochPreset(id)) {
    const isOversold = id === "stoch_oversold";
    els.presetRsiPeriodLabel.textContent = "Período (días)";
    els.presetRsiThresholdLabel.textContent = isOversold
      ? "Umbral de sobreventa"
      : "Umbral de sobrecompra";
    return;
  }
  els.presetRsiPeriodLabel.textContent = "Período";
  els.presetRsiThresholdLabel.textContent = "Umbral";
}

export function selectPreset(id) {
  appState.selectedPreset = id;
  els.formError.classList.add("hidden");
  for (const card of els.presetGrid.querySelectorAll(".preset-card")) {
    const isSelected = card.dataset.presetId === id;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-selected", String(isSelected));
  }
  if (isOscillatorPreset(id)) {
    const defaults = oscillatorPresetDefaults(id);
    els.presetRsiPeriod.value = String(defaults.period);
    els.presetRsiThreshold.value = String(defaults.threshold);
    els.presetRsiFields.classList.remove("hidden");
    syncPresetFieldLabels(id);
    updatePresetRsiHint();
  } else {
    els.presetRsiFields.classList.add("hidden");
  }
  // Sync timeframe hint without importing alert-form (avoid cycle).
  if (appState.formMode === "preset") {
    els.timeframeSelect.disabled = true;
    if (isStochPreset(id)) {
      els.timeframeSelect.value = "1day";
      els.timeframeHint.textContent =
        "Preset Stoch diario: período 7 = últimos 7 días (como gráfico 1Y).";
    } else {
      els.timeframeSelect.value = "15min";
      els.timeframeHint.textContent = "Los presets se evalúan en velas de 15 minutos.";
    }
  }
}

export function updatePresetRsiHint() {
  if (!appState.selectedPreset || !isOscillatorPreset(appState.selectedPreset)) return;
  const defaults = oscillatorPresetDefaults(appState.selectedPreset);
  const period = Number(els.presetRsiPeriod.value) || defaults.period;
  const threshold = Number(els.presetRsiThreshold.value);
  const thresholdText = Number.isFinite(threshold) ? threshold : defaults.threshold;
  const opLabel = defaults.operator === ">" ? "mayor que" : "menor que";

  if (isStochPreset(appState.selectedPreset)) {
    const zone =
      defaults.operator === ">"
        ? "zona de sobrecompra (posible recorte)"
        : "zona de sobreventa (posible rebote)";
    els.presetRsiHint.textContent = `Stoch de ${period} días ${opLabel} ${thresholdText} → ${zone}`;
    return;
  }

  els.presetRsiHint.textContent = `RSI(${period}) ${opLabel} ${thresholdText}`;
}

export function fillPresetRsiFields(presetId, params) {
  const defaults = oscillatorPresetDefaults(presetId);
  if (!defaults) return;
  els.presetRsiPeriod.value = String(params?.period ?? defaults.period);
  els.presetRsiThreshold.value = String(params?.threshold ?? defaults.threshold);
  syncPresetFieldLabels(presetId);
  updatePresetRsiHint();
}

export function resetPresetRsiFields() {
  els.presetRsiPeriod.value = "14";
  els.presetRsiThreshold.value = "30";
  els.presetRsiFields.classList.add("hidden");
  if (els.presetRsiPeriodLabel) els.presetRsiPeriodLabel.textContent = "Período";
  if (els.presetRsiThresholdLabel) els.presetRsiThresholdLabel.textContent = "Umbral";
  els.presetRsiHint.textContent = "RSI(14) menor que 30";
}
