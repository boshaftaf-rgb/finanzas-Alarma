import { fetchTickerQuotes } from "./quotes-api.js";
import { normalizeTicker, validateTicker } from "./ticker-validation.js";
import { showBanner } from "./banner.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { renderTickerPreview } from "./quotes-ui.js";
import { renderAlerts } from "./alerts-view.js";

export async function loadQuotes(tickers = null) {
  const list = tickers ?? [...new Set(appState.alerts.map((a) => a.ticker))];
  if (list.length === 0) {
    appState.quotesByTicker = {};
    return;
  }

  // #region agent log
  fetch("http://127.0.0.1:7270/ingest/32cd8b27-58a1-4715-bdf4-65491b0657ce", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4efbc2" },
    body: JSON.stringify({
      sessionId: "4efbc2",
      runId: "pre-fix",
      location: "quotes-controller.js:loadQuotes",
      message: "loadQuotes start",
      hypothesisId: "A,C",
      data: { tickerCount: list.length, tickers: list },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  appState.quotesLoading = true;
  if (appState.currentView === "alerts") renderAlerts();

  const raw = await fetchTickerQuotes(list);
  appState.quotesByTicker = {};
  for (const [key, value] of Object.entries(raw.quotes)) {
    appState.quotesByTicker[key.toUpperCase()] = value;
  }

  appState.quotesLoading = false;
  if (raw.error && Object.keys(raw.quotes).length === 0) {
    showBanner("error", raw.error);
  }
  if (appState.currentView === "alerts") renderAlerts();
}

export async function previewTickerQuote(rawTicker) {
  const error = validateTicker(rawTicker);
  if (error) {
    els.tickerPreview.classList.add("hidden");
    return;
  }

  const ticker = normalizeTicker(rawTicker);
  // #region agent log
  fetch("http://127.0.0.1:7270/ingest/32cd8b27-58a1-4715-bdf4-65491b0657ce", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4efbc2" },
    body: JSON.stringify({
      sessionId: "4efbc2",
      runId: "pre-fix",
      location: "quotes-controller.js:previewTickerQuote",
      message: "previewTickerQuote start",
      hypothesisId: "A,D",
      data: { ticker },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  els.tickerPreview.classList.remove("hidden");
  els.tickerPreview.innerHTML = `
    <div class="ticker-preview__skeleton" aria-busy="true" aria-label="Cargando cotización">
      <div class="skeleton ticker-preview__skeleton-price"></div>
      <div class="skeleton ticker-preview__skeleton-name"></div>
    </div>
  `;

  const raw = await fetchTickerQuotes([ticker]);
  const quote = raw.quotes[ticker];
  if (quote) {
    appState.quotesByTicker[ticker] = quote;
    renderTickerPreview(ticker);
  } else {
    els.tickerPreview.classList.add("hidden");
  }
}
