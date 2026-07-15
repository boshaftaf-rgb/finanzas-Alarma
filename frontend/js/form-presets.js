import {
  PRESETS,
  isLongEmaCrossPreset,
  isOscillatorPreset,
  isStochPreset,
  oscillatorPresetDefaults,
  presetDefaultTimeframe,
} from "./presets.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { badgeHtml } from "./html-utils.js";
import {
  timeframeChipHtml,
  updateSignalSummary,
} from "./signal-summary.js";

function createPresetCard(preset) {
  const timeframe = presetDefaultTimeframe(preset.id);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "preset-card";
  card.dataset.presetId = preset.id;
  card.setAttribute("role", "option");
  card.setAttribute("aria-selected", "false");
  card.innerHTML = `
    <span class="preset-card__top">
      <span class="preset-card__name">${preset.name}</span>
      ${timeframeChipHtml(timeframe)}
    </span>
    <span class="preset-card__desc">${preset.description}</span>
    ${badgeHtml(preset.kind === "ema" ? "ema" : "rsi", preset.badge)}
  `;
  card.addEventListener("click", () => selectPreset(preset.id));
  return card;
}

function appendPresetGroup(parent, { id, label, presets }) {
  if (presets.length === 0) return;
  const group = document.createElement("div");
  group.className = "preset-group";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", label);
  group.dataset.scale = id;
  group.innerHTML = `<h3 class="preset-group__title">${label}</h3>`;
  const grid = document.createElement("div");
  grid.className = "preset-group__grid";
  for (const preset of presets) {
    grid.appendChild(createPresetCard(preset));
  }
  group.appendChild(grid);
  parent.appendChild(group);
}

export function renderPresetGrid() {
  els.presetGrid.innerHTML = "";
  appendPresetGroup(els.presetGrid, {
    id: "daily",
    label: "Vista diaria / 1Y",
    presets: PRESETS,
  });
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
    els.timeframeSelect.value = "1day";
    if (isStochPreset(id)) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. Stoch: período 7 = últimos 7 días (gráfico 1Y).";
    } else if (isOscillatorPreset(id)) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. RSI: período 14 = últimos 14 días (gráfico 1Y).";
    } else if (isLongEmaCrossPreset(id)) {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. Golden/Death: EMA(50)/EMA(200) como en gráfico 1Y.";
    } else {
      els.timeframeHint.textContent =
        "Todas las alertas usan velas diarias. Impulso EMA(9)/EMA(21) en diario (vista 1Y).";
    }
  }
  updateSignalSummary();
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
    updateSignalSummary();
    return;
  }

  els.presetRsiHint.textContent = `RSI de ${period} días ${opLabel} ${thresholdText}`;
  updateSignalSummary();
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
  els.presetRsiHint.textContent = "RSI de 14 días menor que 30";
}
