import { PRESETS, isRsiPreset, rsiPresetDefaults } from "./presets.js";

function timeframeSuffix(timeframe) {
  return timeframe === "1day" ? " · Diario" : "";
}

export function formatCustomLabel(params) {
  if (!params || typeof params !== "object") return "Alerta personalizada";
  if (params.type === "ema") {
    const direction = params.direction === "down" ? "a la baja" : "al alza";
    return `Cruce personalizado EMA ${params.ema_fast}/${params.ema_slow} ${direction}`;
  }
  if (params.type === "price_ma") {
    const maType = params.ma_type === "ema" ? "EMA" : "SMA";
    const direction = params.direction === "down" ? "a la baja" : "al alza";
    return `Precio cruza ${maType}(${params.period}) ${direction}`;
  }
  if (params.type === "price_level") {
    const op = params.operator === "<=" ? "<=" : ">=";
    return `Precio ${op} ${params.level}`;
  }
  if (params.type === "rsi") {
    const op = params.operator === ">" ? ">" : "<";
    return `RSI(${params.period ?? 14}) ${op} ${params.threshold}`;
  }
  return "Alerta personalizada";
}

export function formatRsiPresetLabel(presetId, params) {
  const preset = PRESETS.find((p) => p.id === presetId);
  const defaults = rsiPresetDefaults(presetId);
  if (!preset || !defaults) return presetId;
  const period = params?.period ?? defaults.period;
  const threshold = params?.threshold ?? defaults.threshold;
  const op = defaults.operator;
  return `${preset.name} — RSI(${period}) ${op} ${threshold}`;
}

export function alertDisplayLabel(alert) {
  let label;
  if (alert.preset_or_custom === "custom") {
    label = formatCustomLabel(alert.params);
  } else if (isRsiPreset(alert.preset_or_custom)) {
    label = formatRsiPresetLabel(alert.preset_or_custom, alert.params);
  } else {
    const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
    label = preset?.name ?? alert.preset_or_custom;
  }
  return `${label}${timeframeSuffix(alert.timeframe)}`;
}

export function alertKind(alert) {
  if (alert.preset_or_custom === "custom") {
    if (alert.params?.type === "rsi") return "rsi";
    if (alert.params?.type === "price_ma" || alert.params?.type === "price_level") return "ema";
    return "ema";
  }
  const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
  return preset?.kind ?? "other";
}

export function alertBadge(alert) {
  if (alert.preset_or_custom === "custom") {
    if (alert.params?.type === "rsi") return "Momentum";
    if (alert.params?.type === "price_ma" || alert.params?.type === "price_level") return "Precio";
    return "Tendencia";
  }
  const preset = PRESETS.find((p) => p.id === alert.preset_or_custom);
  return preset?.badge ?? "";
}
