import {
  buildEmaParams,
  buildPriceLevelParams,
  buildPriceMaParams,
  buildPriceRangeParams,
  buildRsiParams,
  buildRsiPresetParams,
  buildStochasticParams,
  normalizeTimeframe,
  validateEmaParams,
  validatePriceLevelParams,
  validatePriceMaParams,
  validatePriceRangeParams,
  validateRsiParams,
  validateRsiPresetParams,
  validateStochasticParams,
} from "./custom-params.js";
import { isOscillatorPreset, presetDefaultTimeframe } from "./presets.js";
import { validateTicker } from "./ticker-validation.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";

function resolveTimeframe() {
  if (appState.formMode === "preset") {
    return presetDefaultTimeframe(appState.selectedPreset);
  }
  return normalizeTimeframe(els.timeframeSelect.value);
}

export function validateFormPayload() {
  if (!appState.editingAlertId) {
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

  if (appState.formMode === "preset") {
    if (!appState.selectedPreset) {
      els.formError.textContent = "Selecciona una alerta predefinida.";
      els.formError.classList.remove("hidden");
      return null;
    }
    const timeframe = presetDefaultTimeframe(appState.selectedPreset);
    if (isOscillatorPreset(appState.selectedPreset)) {
      const error = validateRsiPresetParams(els.presetRsiPeriod.value, els.presetRsiThreshold.value);
      if (error) {
        els.formError.textContent = error;
        els.formError.classList.remove("hidden");
        return null;
      }
      return {
        presetOrCustom: appState.selectedPreset,
        params: buildRsiPresetParams(els.presetRsiPeriod.value, els.presetRsiThreshold.value),
        timeframe,
      };
    }
    return {
      presetOrCustom: appState.selectedPreset,
      params: {},
      timeframe,
    };
  }

  if (appState.customType === "ema") {
    const error = validateEmaParams(els.emaFast.value, els.emaSlow.value, els.emaDirection.value);
    if (error) {
      els.formError.textContent = error;
      els.formError.classList.remove("hidden");
      return null;
    }
    return {
      presetOrCustom: "custom",
      params: buildEmaParams(els.emaFast.value, els.emaSlow.value, els.emaDirection.value),
      timeframe: resolveTimeframe(),
    };
  }

  if (appState.customType === "price_ma") {
    const error = validatePriceMaParams(
      els.priceMaPeriod.value,
      els.priceMaType.value,
      els.priceMaDirection.value,
    );
    if (error) {
      els.formError.textContent = error;
      els.formError.classList.remove("hidden");
      return null;
    }
    return {
      presetOrCustom: "custom",
      params: buildPriceMaParams(
        els.priceMaPeriod.value,
        els.priceMaType.value,
        els.priceMaDirection.value,
      ),
      timeframe: resolveTimeframe(),
    };
  }

  if (appState.customType === "price_level") {
    const error = validatePriceLevelParams(els.priceLevelValue.value, els.priceLevelOperator.value);
    if (error) {
      els.formError.textContent = error;
      els.formError.classList.remove("hidden");
      return null;
    }
    return {
      presetOrCustom: "custom",
      params: buildPriceLevelParams(els.priceLevelValue.value, els.priceLevelOperator.value),
      timeframe: resolveTimeframe(),
    };
  }

  if (appState.customType === "price_range") {
    const error = validatePriceRangeParams(els.priceRangeLow.value, els.priceRangeHigh.value);
    if (error) {
      els.formError.textContent = error;
      els.formError.classList.remove("hidden");
      return null;
    }
    return {
      presetOrCustom: "custom",
      params: buildPriceRangeParams(els.priceRangeLow.value, els.priceRangeHigh.value),
      timeframe: resolveTimeframe(),
    };
  }

  if (appState.customType === "stochastic") {
    const error = validateStochasticParams(
      els.stochPeriod.value,
      els.stochThreshold.value,
      els.stochOperator.value,
    );
    if (error) {
      els.formError.textContent = error;
      els.formError.classList.remove("hidden");
      return null;
    }
    return {
      presetOrCustom: "custom",
      params: buildStochasticParams(
        els.stochPeriod.value,
        els.stochThreshold.value,
        els.stochOperator.value,
      ),
      timeframe: resolveTimeframe(),
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
    timeframe: resolveTimeframe(),
  };
}
