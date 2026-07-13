import { els } from "./dom.js";

export function setStackLayer(layer, active) {
  if (!layer) return;
  layer.classList.toggle("is-active", active);
  layer.classList.toggle("is-idle", !active);
  layer.setAttribute("aria-hidden", String(!active));
  const isSkeleton = layer.id === "skeleton" || layer.id === "firings-skeleton";
  if (isSkeleton) {
    if (active) layer.setAttribute("aria-busy", "true");
    else layer.removeAttribute("aria-busy");
  }
}

export function setLoading(isLoading) {
  els.emptyState.classList.add("hidden");
  els.alertsStack.classList.remove("hidden");
  setStackLayer(els.skeleton, isLoading);
  if (isLoading) {
    setStackLayer(els.alertList, false);
  }
}

export function setFiringsLoading(isLoading) {
  els.firingsEmpty.classList.add("hidden");
  els.firingsStack.classList.remove("hidden");
  setStackLayer(els.firingsSkeleton, isLoading);
  if (isLoading) {
    setStackLayer(els.firingsList, false);
  }
}
