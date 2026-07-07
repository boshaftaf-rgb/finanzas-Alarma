import { PRESETS } from "./presets.js";

export function formatCustomLabel(params) {
  if (!params || typeof params !== "object") return "Alerta personalizada";
  if (params.type === "ema") {
    const direction = params.direction === "down" ? "a la baja" : "al alza";
    return `Cruce personalizado EMA ${params.ema_fast}/${params.ema_slow} ${direction}`;
  }
  if (params.type === "rsi") {
    const op = params.operator === ">" ? ">" : "<";
    return `RSI(${params.period ?? 14}) ${op} ${params.threshold}`;
  }
  return "Alerta personalizada";
}

export function alertDisplayLabel(alert) {
  if (alert.preset_or_custom === "custom") {
    return formatCustomLabel(alert.params);
  }
  const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
  return preset?.name ?? alert.preset_or_custom;
}

export function alertKind(alert) {
  if (alert.preset_or_custom === "custom") {
    return alert.params?.type === "rsi" ? "rsi" : "ema";
  }
  const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
  return preset?.kind ?? "other";
}

export function alertBadge(alert) {
  if (alert.preset_or_custom === "custom") {
    return alert.params?.type === "rsi" ? "Momentum" : "Tendencia";
  }
  const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
  return preset?.badge ?? "";
}
