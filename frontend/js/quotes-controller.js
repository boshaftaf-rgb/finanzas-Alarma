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
