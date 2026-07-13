import { els } from "./dom.js";

export function showBanner(type, text) {
  els.banner.className = `alert-banner alert-banner--${type}`;
  els.banner.textContent = text;
  els.banner.classList.remove("hidden");
}

export function hideBanner() {
  els.banner.classList.add("hidden");
}
