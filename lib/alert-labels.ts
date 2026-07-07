const PRESET_LABELS: Record<string, string> = {
  ema_cross_bull: "Impulso alcista corto",
  ema_cross_bear: "Impulso bajista corto",
  golden_cross: "Cruce alcista de largo plazo",
  death_cross: "Cruce bajista de largo plazo",
  rsi_oversold: "Sobreventa",
  rsi_overbought: "Sobrecompra",
};

export function presetLabel(presetOrCustom: string): string {
  return PRESET_LABELS[presetOrCustom] ?? presetOrCustom;
}

export interface CustomEmaParams {
  type: "ema";
  ema_fast: number;
  ema_slow: number;
  direction: "up" | "down";
}

export interface CustomRsiParams {
  type: "rsi";
  period: number;
  threshold: number;
  operator: "<" | ">";
}

export type CustomAlertParams = CustomEmaParams | CustomRsiParams;

export function formatCustomLabel(params: Record<string, unknown>): string {
  const type = params.type;
  if (type === "ema") {
    const fast = Number(params.ema_fast);
    const slow = Number(params.ema_slow);
    const direction = params.direction === "down" ? "a la baja" : "al alza";
    return `Cruce personalizado EMA ${fast}/${slow} ${direction}`;
  }
  if (type === "rsi") {
    const period = Number(params.period ?? 14);
    const threshold = Number(params.threshold);
    const operator = params.operator === ">" ? ">" : "<";
    return `RSI(${period}) ${operator} ${threshold}`;
  }
  return "Alerta personalizada";
}

export function formatAlertLabel(
  presetOrCustom: string,
  params: Record<string, unknown> = {},
): string {
  if (presetOrCustom === "custom") {
    return formatCustomLabel(params);
  }
  return presetLabel(presetOrCustom);
}

export function alertKindFromRecord(
  presetOrCustom: string,
  params: Record<string, unknown> = {},
): "ema" | "rsi" | "other" {
  if (presetOrCustom === "custom") {
    return params.type === "rsi" ? "rsi" : "ema";
  }
  const presetKinds: Record<string, "ema" | "rsi"> = {
    ema_cross_bull: "ema",
    ema_cross_bear: "ema",
    golden_cross: "ema",
    death_cross: "ema",
    rsi_oversold: "rsi",
    rsi_overbought: "rsi",
  };
  return presetKinds[presetOrCustom] ?? "other";
}
