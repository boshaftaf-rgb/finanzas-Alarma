import { formatCustomLabel, formatOscillatorPresetLabel } from "./alert-labels.js";
import { normalizeTimeframe } from "./custom-params.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import {
  PRESETS,
  isOscillatorPreset,
  oscillatorPresetDefaults,
  presetDefaultTimeframe,
} from "./presets.js";

const EMA_WATCH_LINES = {
  ema_cross_bull: "EMA(9) cruza arriba EMA(21)",
  ema_cross_bear: "EMA(9) cruza abajo EMA(21)",
  golden_cross: "EMA(50) cruza arriba EMA(200)",
  death_cross: "EMA(50) cruza abajo EMA(200)",
};

export function timeframeChipLabel(timeframe) {
  return timeframe === "1day" ? "Diario" : "15 min";
}

export function timeframeChipHtml(timeframe) {
  const mod = timeframe === "1day" ? "daily" : "intraday";
  return `<span class="chip-timeframe chip-timeframe--${mod}">${timeframeChipLabel(timeframe)}</span>`;
}

export function presetScaleGroup(presetId) {
  return presetDefaultTimeframe(presetId) === "1day" ? "daily" : "intraday";
}

export function verifyLine(timeframe) {
  return timeframe === "1day"
    ? "Intervalo 1 día en Yahoo/TradingView (el rango 1Y solo es la vista)."
    : "Intervalo 15 minutos, no el gráfico diario.";
}

export function candleLine(timeframe) {
  return timeframe === "1day"
    ? "Diario (como gráfico 1Y / intervalo 1 día)"
    : "15 minutos (intradía)";
}

/** Etiqueta de listado sin sufijo de timeframe (el chip lo muestra aparte). */
export function alertListLabel(alert) {
  if (alert.preset_or_custom === "custom") {
    return formatCustomLabel(alert.params);
  }
  if (isOscillatorPreset(alert.preset_or_custom)) {
    return formatOscillatorPresetLabel(alert.preset_or_custom, alert.params);
  }
  const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
  return preset?.name ?? alert.preset_or_custom;
}

function fireLineFor(presetOrCustom, params) {
  if (presetOrCustom === "custom") {
    const type = params?.type;
    if (type === "ema" || type === "price_ma" || type === "price_level" || type === "price_range") {
      return "Cuando el cierre confirma el cruce o la salida entre vela anterior y actual.";
    }
    return "Cuando el indicador en la vela actual cumple el umbral.";
  }
  if (isOscillatorPreset(presetOrCustom)) {
    return "Cuando el indicador en la vela actual cumple el umbral.";
  }
  return "Cuando la EMA corta cruza la lenta entre vela anterior y actual.";
}

function watchLinePreset(presetId, params) {
  if (isOscillatorPreset(presetId)) {
    return formatOscillatorPresetLabel(presetId, params);
  }
  return EMA_WATCH_LINES[presetId] ?? PRESETS.find((p) => p.id === presetId)?.name ?? presetId;
}

function softPresetParams() {
  if (!appState.selectedPreset || !isOscillatorPreset(appState.selectedPreset)) return {};
  const defaults = oscillatorPresetDefaults(appState.selectedPreset);
  return {
    period: Number(els.presetRsiPeriod.value) || defaults.period,
    threshold: Number.isFinite(Number(els.presetRsiThreshold.value))
      ? Number(els.presetRsiThreshold.value)
      : defaults.threshold,
  };
}

function softCustomParams() {
  const type = appState.customType;
  if (type === "ema") {
    return {
      type: "ema",
      ema_fast: Number(els.emaFast.value) || 9,
      ema_slow: Number(els.emaSlow.value) || 21,
      direction: els.emaDirection.value === "down" ? "down" : "up",
    };
  }
  if (type === "price_ma") {
    return {
      type: "price_ma",
      ma_type: els.priceMaType.value === "ema" ? "ema" : "sma",
      period: Number(els.priceMaPeriod.value) || 12,
      direction: els.priceMaDirection.value === "down" ? "down" : "up",
    };
  }
  if (type === "price_level") {
    return {
      type: "price_level",
      level: Number(els.priceLevelValue.value) || 100,
      operator: els.priceLevelOperator.value === "<=" ? "<=" : ">=",
    };
  }
  if (type === "price_range") {
    return {
      type: "price_range",
      low: Number(els.priceRangeLow.value) || 100,
      high: Number(els.priceRangeHigh.value) || 120,
      sides: "both",
    };
  }
  if (type === "stochastic") {
    return {
      type: "stochastic",
      period: Number(els.stochPeriod.value) || 7,
      threshold: Number.isFinite(Number(els.stochThreshold.value))
        ? Number(els.stochThreshold.value)
        : 20,
      operator: els.stochOperator.value === ">" ? ">" : "<",
    };
  }
  return {
    type: "rsi",
    period: Number(els.rsiPeriod.value) || 14,
    threshold: Number.isFinite(Number(els.rsiThreshold.value))
      ? Number(els.rsiThreshold.value)
      : 30,
    operator: els.rsiOperator.value === ">" ? ">" : "<",
  };
}

export function buildSignalSummaryFromForm() {
  if (appState.formMode === "preset") {
    if (!appState.selectedPreset) return null;
    const timeframe = presetDefaultTimeframe(appState.selectedPreset);
    const params = softPresetParams();
    return {
      timeframe,
      watchLine: watchLinePreset(appState.selectedPreset, params),
      candleLine: candleLine(timeframe),
      fireLine: fireLineFor(appState.selectedPreset, params),
      verifyLine: verifyLine(timeframe),
    };
  }

  const timeframe = normalizeTimeframe(els.timeframeSelect.value);
  const params = softCustomParams();
  return {
    timeframe,
    watchLine: formatCustomLabel(params),
    candleLine: candleLine(timeframe),
    fireLine: fireLineFor("custom", params),
    verifyLine: verifyLine(timeframe),
  };
}

export function updateSignalSummary() {
  const el = els.signalSummary;
  if (!el) return;

  const summary = buildSignalSummaryFromForm();
  if (!summary) {
    el.classList.add("signal-summary--empty");
    el.innerHTML =
      '<p class="signal-summary__placeholder">Selecciona un tipo de alerta para ver cómo se calculará.</p>';
    return;
  }

  el.classList.remove("signal-summary--empty");
  el.innerHTML = `
    <div class="signal-summary__header">
      <span class="signal-summary__title">Resumen de la señal</span>
      ${timeframeChipHtml(summary.timeframe)}
    </div>
    <dl class="signal-summary__list">
      <div class="signal-summary__row">
        <dt>Vas a vigilar</dt>
        <dd>${summary.watchLine}</dd>
      </div>
      <div class="signal-summary__row">
        <dt>Velas</dt>
        <dd>${summary.candleLine}</dd>
      </div>
      <div class="signal-summary__row">
        <dt>Disparo</dt>
        <dd>${summary.fireLine}</dd>
      </div>
      <div class="signal-summary__row signal-summary__row--verify">
        <dt>Verificar</dt>
        <dd>${summary.verifyLine}</dd>
      </div>
    </dl>
  `;
}
