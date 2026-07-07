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
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

export function formatEvaluatedAt(iso) {
  if (!iso) return "Sin evaluar aún";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
