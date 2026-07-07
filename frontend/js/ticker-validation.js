const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

export function normalizeTicker(raw) {
  return raw.trim().toUpperCase();
}

export function validateTicker(raw) {
  const ticker = normalizeTicker(raw);
  if (!ticker) return "El ticker no puede estar vacío.";
  if (!TICKER_PATTERN.test(ticker)) {
    return "Formato inválido. Usa símbolos de EE. UU. (ej. AAPL, BRK.B).";
  }
  return null;
}
