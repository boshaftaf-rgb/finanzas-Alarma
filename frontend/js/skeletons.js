import { els } from "./dom.js";

function alertRowSkeletonInnerHtml() {
  return `
    <div>
      <div class="skeleton skeleton-row__label"></div>
      <div class="skeleton skeleton-row__meta"></div>
    </div>
    <div class="skeleton skeleton-row__badge"></div>
    <div class="alert-row__actions">
      <div class="skeleton skeleton-row__action"></div>
      <div class="skeleton skeleton-row__action skeleton-row__action--sm"></div>
      <div class="skeleton skeleton-row__action"></div>
    </div>
  `;
}

export function alertRowSkeletonHtml() {
  return alertRowSkeletonInnerHtml();
}

export function renderSkeleton() {
  els.skeleton.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const group = document.createElement("div");
    group.className = "skeleton-group";
    group.setAttribute("aria-hidden", "true");
    group.innerHTML = `
      <div class="skeleton-group__header">
        <div class="skeleton skeleton-row__ticker"></div>
        <div class="skeleton quote-skeleton"></div>
      </div>
      <div class="skeleton-row skeleton-row--nested">${alertRowSkeletonInnerHtml()}</div>
      <div class="skeleton-row skeleton-row--nested">${alertRowSkeletonInnerHtml()}</div>
    `;
    els.skeleton.appendChild(group);
  }
}

export function renderFiringsSkeleton() {
  els.firingsSkeleton.innerHTML = "";
  for (let i = 0; i < 2; i++) {
    const group = document.createElement("div");
    group.className = "skeleton-group";
    group.setAttribute("aria-hidden", "true");
    group.innerHTML = `
      <div class="skeleton-group__header">
        <div class="skeleton skeleton-row__ticker"></div>
      </div>
      <div class="skeleton-row skeleton-row--firing">
        <div>
          <div class="skeleton skeleton-row__label"></div>
          <div class="skeleton skeleton-row__meta"></div>
        </div>
        <div class="skeleton skeleton-row__delete"></div>
      </div>
      <div class="skeleton-row skeleton-row--firing">
        <div>
          <div class="skeleton skeleton-row__label"></div>
          <div class="skeleton skeleton-row__meta"></div>
        </div>
        <div class="skeleton skeleton-row__delete"></div>
      </div>
    `;
    els.firingsSkeleton.appendChild(group);
  }
}
