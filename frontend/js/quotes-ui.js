import { formatPercentChange, formatPrice, formatVolume } from "./format.js";
import { els } from "./dom.js";
import { appState } from "./app-state.js";

export function quoteChangeClass(percentChange) {
  if (percentChange > 0) return "up";
  if (percentChange < 0) return "down";
  return "flat";
}

export function quoteBlockHtml(ticker, { compact = false } = {}) {
  const quote = appState.quotesByTicker[ticker.toUpperCase()];
  if (appState.quotesLoading && !quote) {
    return `<div class="alert-row__quote" aria-busy="true"><span class="skeleton quote-skeleton"></span></div>`;
  }
  if (!quote) {
    return `<div class="alert-row__quote alert-row__quote--muted">Sin cotización</div>`;
  }

  const dir = quoteChangeClass(quote.percentChange);
  const volume = formatVolume(quote.volume);
  const volumeHtml = !compact && volume ? `<span class="quote-volume">Vol. ${volume}</span>` : "";

  return `
    <div class="alert-row__quote">
      <span class="quote-price">${formatPrice(quote.price)}</span>
      <span class="quote-change quote-change--${dir}">${formatPercentChange(quote.percentChange)}</span>
      ${volumeHtml}
    </div>
    ${!compact && quote.name ? `<div class="alert-row__company" title="${quote.name}">${quote.name}</div>` : ""}
  `;
}

export function renderTickerPreview(ticker) {
  const quote = appState.quotesByTicker[ticker.toUpperCase()];
  if (!quote) {
    els.tickerPreview.classList.add("hidden");
    els.tickerPreview.innerHTML = "";
    return;
  }

  const dir = quoteChangeClass(quote.percentChange);
  els.tickerPreview.classList.remove("hidden");
  els.tickerPreview.innerHTML = `
    <div class="ticker-preview__row">
      <span class="ticker-preview__price">${formatPrice(quote.price)}</span>
      <span class="quote-change quote-change--${dir}">${formatPercentChange(quote.percentChange)}</span>
    </div>
    ${quote.name ? `<p class="ticker-preview__name">${quote.name}</p>` : ""}
  `;
}
