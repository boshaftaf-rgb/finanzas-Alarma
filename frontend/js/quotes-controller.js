import { fetchTickerQuotes } from "./quotes-api.js";
import { normalizeTicker, validateTicker } from "./ticker-validation.js";
import { showBanner, hideBanner } from "./banner.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";
import { renderTickerPreview } from "./quotes-ui.js";
import { renderAlerts } from "./alerts-view.js";

function waitSeconds(remainingMs) {
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

function quotesStatusMessage(progress) {
  const { phase, loaded, total, remainingMs, chunkCount } = progress;

  if (phase === "start" && chunkCount > 1) {
    return `Cargando ${total} cotizaciones en ${chunkCount} pasos (Twelve Data admite 8 por minuto). No recargues la página.`;
  }
  if (phase === "waiting") {
    return `${loaded} de ${total} cotizaciones listas. El resto llega en ${waitSeconds(remainingMs)} s. No recargues.`;
  }
  if (phase === "retry") {
    return `Twelve Data alcanzó el límite de créditos. Reintento en ${waitSeconds(remainingMs)} s. No recargues.`;
  }
  if (phase === "fetch" && loaded > 0) {
    return `Cargando el resto de cotizaciones (${loaded} de ${total})…`;
  }
  if (total > 0 && loaded === 0) {
    return "Cargando cotizaciones…";
  }
  return `Cargando cotizaciones (${loaded} de ${total})…`;
}

function markQuotesPending(tickers) {
  appState.quotesPending = new Set(tickers.map((t) => String(t).toUpperCase()).filter(Boolean));
}

function applyQuotesMap(quotes) {
  for (const [key, value] of Object.entries(quotes)) {
    const ticker = key.toUpperCase();
    appState.quotesByTicker[ticker] = value;
    appState.quotesPending.delete(ticker);
  }
  if (appState.currentView === "alerts") renderAlerts();
}

function applyQuoteProgress(progress) {
  if (progress.quotes) applyQuotesMap(progress.quotes);

  const sticky =
    progress.phase === "waiting" ||
    progress.phase === "retry" ||
    (progress.chunkCount > 1 && progress.phase !== "chunk") ||
    (progress.total > 8 && progress.loaded < progress.total);

  if (!sticky) return;
  showBanner("info", quotesStatusMessage(progress));
}

export async function loadQuotes(tickers = null) {
  const list =
    tickers ??
    [
      ...new Set([
        ...appState.tickerOrder.map((t) => String(t).toUpperCase()),
        ...appState.alerts.map((a) => String(a.ticker).toUpperCase()),
      ]),
    ].filter(Boolean);
  if (list.length === 0) {
    appState.quotesByTicker = {};
    appState.quotesPending = new Set();
    appState.quotesLoading = false;
    return;
  }

  markQuotesPending(list);
  appState.quotesLoading = true;
  if (appState.currentView === "alerts") renderAlerts();

  let raw = await fetchTickerQuotes(list, { onProgress: applyQuoteProgress });
  applyQuotesMap(raw.quotes);

  let missing = list.filter((ticker) => !appState.quotesByTicker[ticker]);
  if (missing.length > 0 && raw.error) {
    showBanner(
      "info",
      `Faltan ${missing.length} de ${list.length} cotizaciones (límite de Twelve Data). Reintento automático; no recargues.`,
    );
    markQuotesPending(missing);
    const retry = await fetchTickerQuotes(missing, { onProgress: applyQuoteProgress });
    applyQuotesMap(retry.quotes);
    if (retry.error) raw = retry;
    missing = list.filter((ticker) => !appState.quotesByTicker[ticker]);
  }

  appState.quotesPending = new Set();
  appState.quotesLoading = false;
  if (missing.length > 0) {
    showBanner(
      "info",
      `${list.length - missing.length} cotizaciones listas. Faltan ${missing.join(", ")} por el límite de Twelve Data; en un minuto deberían aparecer sin recargar en bucle.`,
    );
  } else if (raw.error && Object.keys(raw.quotes).length === 0) {
    showBanner("error", raw.error);
  } else {
    hideBanner("info");
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

  const raw = await fetchTickerQuotes([ticker], { onProgress: applyQuoteProgress });
  const quote = raw.quotes[ticker];
  if (quote) {
    appState.quotesByTicker[ticker] = quote;
    renderTickerPreview(ticker);
    hideBanner("info");
  } else {
    els.tickerPreview.classList.add("hidden");
  }
}
