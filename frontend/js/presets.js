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
  },
  {
    id: "rsi_overbought",
    name: "Sobrecompra",
    description: "El precio subió con fuerza en velas recientes",
    kind: "rsi",
    badge: "Momentum",
  },
];

export function presetLabel(id) {
  return PRESETS.find((p) => p.id === id)?.name ?? id;
}

export function presetKind(id) {
  return PRESETS.find((p) => p.id === id)?.kind ?? "other";
}

export function presetBadge(id) {
  return PRESETS.find((p) => p.id === id)?.badge ?? "";
}
