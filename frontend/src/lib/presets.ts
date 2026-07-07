import type { PresetId } from "./types";

export interface PresetOption {
  id: PresetId;
  name: string;
  description: string;
  kind: "ema" | "rsi";
}

export const PRESETS: PresetOption[] = [
  {
    id: "ema_cross_bull",
    name: "Cruce alcista rápido",
    description: "EMA 9 cruza arriba EMA 21",
    kind: "ema",
  },
  {
    id: "ema_cross_bear",
    name: "Cruce bajista rápido",
    description: "EMA 9 cruza abajo EMA 21",
    kind: "ema",
  },
  {
    id: "golden_cross",
    name: "Golden Cross",
    description: "EMA 50 cruza arriba EMA 200",
    kind: "ema",
  },
  {
    id: "death_cross",
    name: "Death Cross",
    description: "EMA 50 cruza abajo EMA 200",
    kind: "ema",
  },
  {
    id: "rsi_oversold",
    name: "RSI sobreventa",
    description: "RSI(14) menor que 30",
    kind: "rsi",
  },
  {
    id: "rsi_overbought",
    name: "RSI sobrecompra",
    description: "RSI(14) mayor que 70",
    kind: "rsi",
  },
];

export function presetLabel(id: string): string {
  return PRESETS.find((p) => p.id === id)?.name ?? id;
}

export function presetKind(id: string): "ema" | "rsi" | "other" {
  const preset = PRESETS.find((p) => p.id === id);
  return preset?.kind ?? "other";
}
