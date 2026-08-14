import { els } from "./dom.js";

export function showBanner(type, text) {
  const live = type === "error" ? "assertive" : "polite";
  els.banner.className = `alert-banner alert-banner--${type}`;
  els.banner.dataset.type = type;
  els.banner.textContent = text;
  els.banner.setAttribute("role", type === "error" ? "alert" : "status");
  els.banner.setAttribute("aria-live", live);
  els.banner.classList.remove("hidden");
}

export function hideBanner(type = null) {
  if (type && els.banner.dataset.type !== type) return;
  els.banner.classList.add("hidden");
  delete els.banner.dataset.type;
}
