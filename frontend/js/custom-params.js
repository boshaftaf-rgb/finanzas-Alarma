export function validateEmaParams(fastRaw, slowRaw, direction) {
  const fast = Number(fastRaw);
  const slow = Number(slowRaw);
  if (!Number.isInteger(fast) || fast < 2 || fast > 200) {
    return "La media rápida debe ser un número entre 2 y 200.";
  }
  if (!Number.isInteger(slow) || slow < 2 || slow > 200) {
    return "La media lenta debe ser un número entre 2 y 200.";
  }
  if (fast >= slow) {
    return "La media rápida debe ser menor que la media lenta.";
  }
  if (direction !== "up" && direction !== "down") {
    return "Selecciona la dirección del cruce.";
  }
  return null;
}

export function validateRsiParams(periodRaw, thresholdRaw, operator) {
  const period = Number(periodRaw);
  const threshold = Number(thresholdRaw);
  if (!Number.isInteger(period) || period < 2 || period > 50) {
    return "El período RSI debe ser un número entre 2 y 50.";
  }
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    return "El umbral debe estar entre 0 y 100.";
  }
  if (operator !== "<" && operator !== ">") {
    return "Selecciona el operador (menor o mayor que).";
  }
  return null;
}

export function buildEmaParams(fastRaw, slowRaw, direction) {
  return {
    type: "ema",
    ema_fast: Number(fastRaw),
    ema_slow: Number(slowRaw),
    direction,
  };
}

export function buildRsiParams(periodRaw, thresholdRaw, operator) {
  return {
    type: "rsi",
    period: Number(periodRaw),
    threshold: Number(thresholdRaw),
    operator,
  };
}

export function validateStochasticParams(periodRaw, thresholdRaw, operator) {
  const period = Number(periodRaw);
  const threshold = Number(thresholdRaw);
  if (!Number.isInteger(period) || period < 2 || period > 50) {
    return "El período Stochastic debe ser un número entre 2 y 50.";
  }
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    return "El umbral debe estar entre 0 y 100.";
  }
  if (operator !== "<" && operator !== ">") {
    return "Selecciona el operador (menor o mayor que).";
  }
  return null;
}

export function buildStochasticParams(periodRaw, thresholdRaw, operator) {
  return {
    type: "stochastic",
    period: Number(periodRaw),
    threshold: Number(thresholdRaw),
    operator,
  };
}

export function validateRsiPresetParams(periodRaw, thresholdRaw) {
  const period = Number(periodRaw);
  const threshold = Number(thresholdRaw);
  if (!Number.isInteger(period) || period < 2 || period > 50) {
    return "El período debe ser un número entre 2 y 50.";
  }
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    return "El umbral debe estar entre 0 y 100.";
  }
  return null;
}

export function buildRsiPresetParams(periodRaw, thresholdRaw) {
  return {
    period: Number(periodRaw),
    threshold: Number(thresholdRaw),
  };
}

export function validatePriceMaParams(periodRaw, maType, direction) {
  const period = Number(periodRaw);
  if (!Number.isInteger(period) || period < 2 || period > 200) {
    return "El período debe ser un número entre 2 y 200.";
  }
  if (maType !== "sma" && maType !== "ema") {
    return "Selecciona el tipo de media (SMA o EMA).";
  }
  if (direction !== "up" && direction !== "down") {
    return "Selecciona la dirección del cruce.";
  }
  return null;
}

export function buildPriceMaParams(periodRaw, maType, direction) {
  return {
    type: "price_ma",
    ma_type: maType,
    period: Number(periodRaw),
    direction,
  };
}

export function validatePriceLevelParams(levelRaw, operator) {
  const level = Number(levelRaw);
  if (!Number.isFinite(level) || level <= 0) {
    return "El precio objetivo debe ser un número mayor que 0.";
  }
  if (operator !== ">=" && operator !== "<=") {
    return "Selecciona la condición del precio (>= o <=).";
  }
  return null;
}

export function buildPriceLevelParams(levelRaw, operator) {
  return {
    type: "price_level",
    level: Number(levelRaw),
    operator,
  };
}

export function validatePriceRangeParams(lowRaw, highRaw) {
  const low = Number(lowRaw);
  const high = Number(highRaw);
  if (!Number.isFinite(low) || low <= 0) {
    return "El piso del rango debe ser un número mayor que 0.";
  }
  if (!Number.isFinite(high) || high <= 0) {
    return "El techo del rango debe ser un número mayor que 0.";
  }
  if (low >= high) {
    return "El piso debe ser menor que el techo del rango.";
  }
  return null;
}

export function buildPriceRangeParams(lowRaw, highRaw) {
  return {
    type: "price_range",
    low: Number(lowRaw),
    high: Number(highRaw),
    sides: "both",
  };
}

export function normalizeTimeframe(value) {
  return value === "1day" ? "1day" : "15min";
}
