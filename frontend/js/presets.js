export const MAX_UNIQUE_TICKERS = 15;

export const PRESETS = [
  {
    id: "ema_cross_bull",
    name: "Impulso alcista corto",
    description: "La tendencia rápida supera a la intermedia",
    kind: "ema",
    badge: "Tendencia",
  },
  {
    id: "ema_cross_bear",
    name: "Impulso bajista corto",
    description: "La tendencia rápida cae por debajo de la intermedia",
    kind: "ema",
    badge: "Tendencia",
  },
  {
    id: "golden_cross",
    name: "Cruce alcista de largo plazo",
    description: "La tendencia media supera a la de largo plazo",
    kind: "ema",
    badge: "Tendencia",
  },
  {
    id: "death_cross",
    name: "Cruce bajista de largo plazo",
    description: "La tendencia media cae por debajo de la de largo plazo",
    kind: "ema",
    badge: "Tendencia",
  },
  {
    id: "rsi_oversold",
    name: "Sobreventa",
    description: "El precio cayó con fuerza en velas recientes",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 14,
    defaultThreshold: 30,
    operator: "<",
  },
  {
    id: "rsi_overbought",
    name: "Sobrecompra",
    description: "El precio subió con fuerza en velas recientes",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 14,
    defaultThreshold: 70,
    operator: ">",
  },
  {
    id: "stoch_oversold",
    name: "Sobreventa Stoch",
    description: "El cierre está cerca del mínimo del rango reciente",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 7,
    defaultThreshold: 20,
    operator: "<",
    indicator: "stoch",
  },
  {
    id: "stoch_overbought",
    name: "Sobrecompra Stoch",
    description: "El cierre está cerca del máximo del rango reciente",
    kind: "rsi",
    badge: "Momentum",
    defaultPeriod: 7,
    defaultThreshold: 80,
    operator: ">",
    indicator: "stoch",
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
