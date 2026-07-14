export const ALERTS_SUBTITLE =
  "Monitoreo técnico en velas de 15 min. Precios con datos de mercado (pueden tener ligero retraso).";

export const FIRINGS_SUBTITLE =
  "Correos enviados. Permanecen aquí agrupados por ticker hasta que los borres.";

/** Estado mutable del panel (una sola fuente de verdad). */
export const appState = {
  alerts: [],
  firings: [],
  firedAlertIds: new Set(),
  tickerOrder: [],
  currentView: "alerts",
  busyId: null,
  selectedPreset: null,
  quotesByTicker: {},
  quotesLoading: false,
  editingAlertId: null,
  formMode: "preset",
  customType: "ema",
};
