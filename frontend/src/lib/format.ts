export function mapDbError(message: string): string {
  if (message.includes("Límite de 15 tickers")) {
    return "Ya tienes 15 tickers únicos activos. Desactiva o elimina una alerta antes de añadir otro ticker.";
  }
  if (message.includes("Límite de 5 alertas activas")) {
    return "Máximo 5 alertas activas por ticker. Desactiva o elimina una alerta en este ticker.";
  }
  if (message.includes("alerts_ticker_format")) {
    return "Formato de ticker inválido.";
  }
  if (message.includes("duplicate key") || message.includes("unique")) {
    return "Ya existe una alerta igual para este ticker.";
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

export function formatEvaluatedAt(iso: string | null): string {
  if (!iso) return "Sin evaluar aún";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
