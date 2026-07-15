const PRESET_LABELS: Record<string, string> = {
  ema_cross_bull: "Impulso alcista corto",
  ema_cross_bear: "Impulso bajista corto",
  golden_cross: "Cruce alcista de largo plazo",
  death_cross: "Cruce bajista de largo plazo",
  rsi_oversold: "Sobreventa",
  rsi_overbought: "Sobrecompra",
  stoch_oversold: "Sobreventa Stoch",
  stoch_overbought: "Sobrecompra Stoch",
};

const RSI_PRESET_DEFAULTS: Record<string, { period: number; threshold: number; operator: "<" | ">" }> = {
  rsi_oversold: { period: 14, threshold: 30, operator: "<" },
  rsi_overbought: { period: 14, threshold: 70, operator: ">" },
};

const STOCH_PRESET_DEFAULTS: Record<string, { period: number; threshold: number; operator: "<" | ">" }> = {
  stoch_oversold: { period: 7, threshold: 20, operator: "<" },
  stoch_overbought: { period: 7, threshold: 80, operator: ">" },
};

function isRsiPreset(presetOrCustom: string): boolean {
  return presetOrCustom === "rsi_oversold" || presetOrCustom === "rsi_overbought";
}

function isStochPreset(presetOrCustom: string): boolean {
  return presetOrCustom === "stoch_oversold" || presetOrCustom === "stoch_overbought";
}

export function formatRsiPresetLabel(
  presetOrCustom: string,
  params: Record<string, unknown> = {},
): string {
  const defaults = RSI_PRESET_DEFAULTS[presetOrCustom];
  if (!defaults) return presetLabel(presetOrCustom);
  const period = Number(params.period ?? defaults.period);
  const threshold = Number(params.threshold ?? defaults.threshold);
  const name = presetLabel(presetOrCustom);
  return `${name} — RSI(${period}) ${defaults.operator} ${threshold}`;
}

export function formatStochPresetLabel(
  presetOrCustom: string,
  params: Record<string, unknown> = {},
): string {
  const defaults = STOCH_PRESET_DEFAULTS[presetOrCustom];
  if (!defaults) return presetLabel(presetOrCustom);
  const period = Number(params.period ?? defaults.period);
  const threshold = Number(params.threshold ?? defaults.threshold);
  const name = presetLabel(presetOrCustom);
  return `${name} — Stoch(${period}) ${defaults.operator} ${threshold}`;
}

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

export interface CustomStochasticParams {
  type: "stochastic";
  period: number;
  threshold: number;
  operator: "<" | ">";
}

export interface CustomPriceMaParams {
  type: "price_ma";
  ma_type: "sma" | "ema";
  period: number;
  direction: "up" | "down";
}

export interface CustomPriceLevelParams {
  type: "price_level";
  level: number;
  operator: ">=" | "<=";
}

export interface CustomPriceRangeParams {
  type: "price_range";
  low: number;
  high: number;
  /** Siempre ambos lados (alza y baja). Se conserva en params por compatibilidad. */
  sides: "both";
}

export type CustomAlertParams =
  | CustomEmaParams
  | CustomRsiParams
  | CustomStochasticParams
  | CustomPriceMaParams
  | CustomPriceLevelParams
  | CustomPriceRangeParams;

export function formatCustomLabel(params: Record<string, unknown>): string {
  const type = params.type;
  if (type === "ema") {
    const fast = Number(params.ema_fast);
    const slow = Number(params.ema_slow);
    const direction = params.direction === "down" ? "a la baja" : "al alza";
    return `Cruce personalizado EMA ${fast}/${slow} ${direction}`;
  }
  if (type === "price_ma") {
    const maType = params.ma_type === "ema" ? "EMA" : "SMA";
    const period = Number(params.period);
    const direction = params.direction === "down" ? "a la baja" : "al alza";
    return `Precio cruza ${maType}(${period}) ${direction}`;
  }
  if (type === "price_level") {
    const level = Number(params.level);
    const operator = params.operator === "<=" ? "<=" : ">=";
    return `Precio ${operator} ${level}`;
  }
  if (type === "price_range") {
    const low = Number(params.low);
    const high = Number(params.high);
    return `Sale del rango ${low}–${high}`;
  }
  if (type === "rsi") {
    const period = Number(params.period ?? 14);
    const threshold = Number(params.threshold);
    const operator = params.operator === ">" ? ">" : "<";
    return `RSI(${period}) ${operator} ${threshold}`;
  }
  if (type === "stochastic") {
    const period = Number(params.period ?? 7);
    const threshold = Number(params.threshold);
    const operator = params.operator === ">" ? ">" : "<";
    return `Stoch(${period}) ${operator} ${threshold}`;
  }
  return "Alerta personalizada";
}

export function formatAlertLabel(
  presetOrCustom: string,
  params: Record<string, unknown> = {},
  timeframe?: string | null,
): string {
  let label: string;
  if (presetOrCustom === "custom") {
    label = formatCustomLabel(params);
  } else if (isRsiPreset(presetOrCustom)) {
    label = formatRsiPresetLabel(presetOrCustom, params);
  } else if (isStochPreset(presetOrCustom)) {
    label = formatStochPresetLabel(presetOrCustom, params);
  } else {
    label = presetLabel(presetOrCustom);
  }

  if (timeframe === "1day") {
    return `${label} · Diario`;
  }
  if (timeframe === "15min") {
    return `${label} · 15 min`;
  }
  return label;
}

export function alertKindFromRecord(
  presetOrCustom: string,
  params: Record<string, unknown> = {},
): "ema" | "rsi" | "other" {
  if (presetOrCustom === "custom") {
    if (params.type === "rsi" || params.type === "stochastic") return "rsi";
    if (params.type === "price_ma" || params.type === "price_level" || params.type === "price_range") {
      return "ema";
    }
    return "ema";
  }
  const presetKinds: Record<string, "ema" | "rsi"> = {
    ema_cross_bull: "ema",
    ema_cross_bear: "ema",
    golden_cross: "ema",
    death_cross: "ema",
    rsi_oversold: "rsi",
    rsi_overbought: "rsi",
    stoch_oversold: "rsi",
    stoch_overbought: "rsi",
  };
  return presetKinds[presetOrCustom] ?? "other";
}
