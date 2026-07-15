export const MAX_UNIQUE_TICKERS = 15;

export const PRESETS = [
  {
    id: "ema_cross_bull",
    name: "Impulso alcista corto",
    description: "EMA(9) cruza arriba EMA(21) en diario (vista 1Y)",
    kind: "ema",
    badge: "Tendencia",
    defaultTimeframe: "1day",
  },
  {
    id: "ema_cross_bear",
    name: "Impulso bajista corto",
    description: "EMA(9) cruza abajo EMA(21) en diario (vista 1Y)",
    kind: "ema",
    badge: "Tendencia",
    defaultTimeframe: "1day",
  },
  {
    id: "golden_cross",
    name: "Cruce alcista de largo plazo",
    description: "Golden Cross diario: EMA(50) cruza arriba EMA(200) (vista 1Y)",
    kind: "ema",
    badge: "Tendencia",
    defaultTimeframe: "1day",
  },
  {
    id: "death_cross",
    name: "Cruce bajista de largo plazo",
    description: "Death Cross diario: EMA(50) cruza abajo EMA(200) (vista 1Y)",
    kind: "ema",
    badge: "Tendencia",
    defaultTimeframe: "1day",
  },
  {
    id: "rsi_oversold",
    name: "Sobreventa",
    description: "RSI(14) diario < 30: sobreventa como en gráfico 1Y",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 14,
    defaultThreshold: 30,
    operator: "<",
    defaultTimeframe: "1day",
  },
  {
    id: "rsi_overbought",
    name: "Sobrecompra",
    description: "RSI(14) diario > 70: sobrecompra como en gráfico 1Y",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 14,
    defaultThreshold: 70,
    operator: ">",
    defaultTimeframe: "1day",
  },
  {
    id: "stoch_oversold",
    name: "Sobreventa Stoch",
    description: "Stoch(7) diario: cierre cerca del mínimo de la última semana (vista 1Y)",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 7,
    defaultThreshold: 20,
    operator: "<",
    indicator: "stoch",
    defaultTimeframe: "1day",
  },
  {
    id: "stoch_overbought",
    name: "Sobrecompra Stoch",
    description: "Stoch(7) diario: cierre cerca del máximo de la última semana (vista 1Y)",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 7,
    defaultThreshold: 80,
    operator: ">",
    indicator: "stoch",
    defaultTimeframe: "1day",
  },
];

export function isRsiPreset(id) {
  return id === "rsi_oversold" || id === "rsi_overbought";
}

export function isStochPreset(id) {
  return id === "stoch_oversold" || id === "stoch_overbought";
}

export function isOscillatorPreset(id) {
  return isRsiPreset(id) || isStochPreset(id);
}

/** Golden / Death Cross clásicos: EMA 50/200 en diario. */
export function isLongEmaCrossPreset(id) {
  return id === "golden_cross" || id === "death_cross";
}

/** Timeframe fijo de todos los presets: diario (vista 1Y). */
export function presetDefaultTimeframe(_id) {
  return "1day";
}

export function rsiPresetDefaults(id) {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset || !isRsiPreset(id)) return null;
  return {
    period: preset.defaultPeriod,
    threshold: preset.defaultThreshold,
    operator: preset.operator,
  };
}

export function stochPresetDefaults(id) {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset || !isStochPreset(id)) return null;
  return {
    period: preset.defaultPeriod,
    threshold: preset.defaultThreshold,
    operator: preset.operator,
  };
}

export function oscillatorPresetDefaults(id) {
  return rsiPresetDefaults(id) ?? stochPresetDefaults(id);
}

export function presetLabel(id) {
  return PRESETS.find((p) => p.id === id)?.name ?? id;
}

export function presetKind(id) {
  return PRESETS.find((p) => p.id === id)?.kind ?? "other";
}

export function presetBadge(id) {
  return PRESETS.find((p) => p.id === id)?.badge ?? "";
}
