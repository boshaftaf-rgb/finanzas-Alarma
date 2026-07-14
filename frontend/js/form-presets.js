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
    updatePresetRsiHint();
  } else {
    els.presetRsiFields.classList.add("hidden");
  }
}

export function updatePresetRsiHint() {
  if (!appState.selectedPreset || !isOscillatorPreset(appState.selectedPreset)) return;
  const defaults = oscillatorPresetDefaults(appState.selectedPreset);
  const period = Number(els.presetRsiPeriod.value) || defaults.period;
  const threshold = Number(els.presetRsiThreshold.value);
  const thresholdText = Number.isFinite(threshold) ? threshold : defaults.threshold;
  const opLabel = defaults.operator === ">" ? "mayor que" : "menor que";
  const indicator = isStochPreset(appState.selectedPreset) ? "Stoch" : "RSI";
  els.presetRsiHint.textContent = `${indicator}(${period}) ${opLabel} ${thresholdText}`;
}

export function fillPresetRsiFields(presetId, params) {
  const defaults = oscillatorPresetDefaults(presetId);
  if (!defaults) return;
  els.presetRsiPeriod.value = String(params?.period ?? defaults.period);
  els.presetRsiThreshold.value = String(params?.threshold ?? defaults.threshold);
  updatePresetRsiHint();
}

export function resetPresetRsiFields() {
  els.presetRsiPeriod.value = "14";
  els.presetRsiThreshold.value = "30";
  els.presetRsiFields.classList.add("hidden");
  els.presetRsiHint.textContent = "RSI(14) menor que 30";
}
