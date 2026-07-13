import { els } from "./dom.js";
import { appState, ALERTS_SUBTITLE, FIRINGS_SUBTITLE } from "./app-state.js";
import { renderAlerts } from "./alerts-view.js";
import { renderFirings } from "./firings-view.js";

export function showAlertsView() {
  appState.currentView = "alerts";
  els.alertsView.classList.remove("hidden");
  els.firingsView.classList.add("hidden");
  els.btnFirings.classList.remove("is-active");
  els.pageTitle.textContent = "Mis alertas";
  els.pageSubtitle.textContent = ALERTS_SUBTITLE;
  els.tickerCounter.classList.remove("hidden");
  els.btnNewAlert.classList.remove("hidden");
  renderAlerts();
}

export function showFiringsView() {
  appState.currentView = "firings";
  els.alertsView.classList.add("hidden");
  els.firingsView.classList.remove("hidden");
  els.btnFirings.classList.add("is-active");
  els.pageTitle.textContent = "Disparos";
  els.pageSubtitle.textContent = FIRINGS_SUBTITLE;
  els.tickerCounter.classList.add("hidden");
  els.btnNewAlert.classList.add("hidden");
  renderFirings();
}
