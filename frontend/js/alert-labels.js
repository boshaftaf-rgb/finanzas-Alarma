import { PRESETS, isRsiPreset, rsiPresetDefaults } from "./presets.js";

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
  if (alert.preset_or_custom === "custom") {
    return formatCustomLabel(alert.params);
  }
  if (isRsiPreset(alert.preset_or_custom)) {
    return formatRsiPresetLabel(alert.preset_or_custom, alert.params);
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
