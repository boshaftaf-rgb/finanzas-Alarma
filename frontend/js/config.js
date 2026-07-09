export async function loadAppConfig() {
  if (window.__STOCK_ALERTS_CONFIG__) {
    return window.__STOCK_ALERTS_CONFIG__;
  }

  await loadOptionalLocalConfig();

  if (window.__STOCK_ALERTS_CONFIG__) {
    return window.__STOCK_ALERTS_CONFIG__;
  }

  const response = await fetch("/api/config");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error ||
        "No se pudo cargar la configuración. En local, crea frontend/config.local.js desde config.local.example.js.",
    );
  }
  return response.json();
}

function loadOptionalLocalConfig() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = new URL("../config.local.js", import.meta.url).href;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}
