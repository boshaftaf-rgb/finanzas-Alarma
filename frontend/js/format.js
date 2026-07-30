export function mapDbError(message) {
  if (message.includes("Límite de 15 tickers")) {
    return "Ya tienes 15 tickers únicos activos. Desactiva o elimina una alerta antes de añadir otro ticker.";
  }
  if (message.includes("Límite de 5 alertas activas")) {
    return "Máximo 5 alertas activas por ticker. Desactiva o elimina una alerta en este ticker.";
  }
  if (message.includes("alerts_ticker_format")) {
    return "Formato de ticker inválido.";
  }
  if (message.includes("alerts_preset_or_custom_valid")) {
    return "Este tipo de alerta no está admitido aún en la base de datos.";
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

export function formatEvaluatedAt(iso) {
  if (!iso) return "Sin evaluar aún";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Fecha de la vela. Diarias: calendario UTC (Twelve Data). Intradía: hora ET. */
export function formatCandleAt(iso, timeframe) {
  if (!iso) return "—";
  const isDaily = timeframe === "1day";
  // Daily bars are UTC-midnight calendar dates; formatting in ET shifts −1 day.
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: isDaily ? "UTC" : "America/New_York",
    dateStyle: "short",
    ...(isDaily ? {} : { timeStyle: "short" }),
  }).format(new Date(iso));
}

/** Momento real de envío del correo — siempre America/New_York. */
export function formatSentAt(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/New_York",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** @deprecated Prefer formatCandleAt / formatSentAt */
export function formatFiringAt(iso, timeframe) {
  return formatCandleAt(iso, timeframe);
}

export function formatPrice(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentChange(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(value) {
  if (value == null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
