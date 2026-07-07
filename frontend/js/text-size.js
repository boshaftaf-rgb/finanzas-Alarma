const STORAGE_KEY = "stock-alerts-text-size";
const VALID_SIZES = new Set(["small", "normal", "large", "xlarge"]);

export function initTextSize() {
  const saved = localStorage.getItem(STORAGE_KEY) || "normal";
  applyTextSize(saved);

  for (const button of document.querySelectorAll(".text-size-btn")) {
    button.addEventListener("click", () => {
      const size = button.dataset.size;
      if (size) applyTextSize(size);
    });
  }
}

function applyTextSize(size) {
  const resolved = VALID_SIZES.has(size) ? size : "normal";
  document.documentElement.setAttribute("data-text-size", resolved);
  localStorage.setItem(STORAGE_KEY, resolved);

  for (const button of document.querySelectorAll(".text-size-btn")) {
    const isActive = button.dataset.size === resolved;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}
