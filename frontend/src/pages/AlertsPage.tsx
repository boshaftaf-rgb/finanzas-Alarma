import { useCallback, useEffect, useState } from "react";
import {
  countUniqueActiveTickers,
  createAlert,
  deleteAlert,
  fetchAlerts,
  setAlertActive,
} from "../lib/alerts-api";
import { mapDbError } from "../lib/format";
import { isSupabaseConfigured } from "../lib/supabase";
import type { Alert, PresetId } from "../lib/types";
import { MAX_UNIQUE_TICKERS } from "../config";
import { AlertFormModal } from "../components/AlertFormModal";
import { AlertListSkeleton } from "../components/AlertListSkeleton";
import { AlertRow } from "../components/AlertRow";
import { Banner } from "../components/Banner";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar las alertas.";
      setBanner({ type: "error", text: mapDbError(message) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setBanner({
        type: "error",
        text: "Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para conectar con Supabase.",
      });
      return;
    }
    void loadAlerts();
  }, [loadAlerts]);

  const uniqueTickers = countUniqueActiveTickers(alerts);
  const atTickerLimit = uniqueTickers >= MAX_UNIQUE_TICKERS;

  const handleCreate = async (ticker: string, preset: PresetId) => {
    try {
      const created = await createAlert({ ticker, preset });
      setAlerts((prev) => [created, ...prev].sort((a, b) => a.ticker.localeCompare(b.ticker)));
      setBanner({ type: "success", text: `Alerta creada para ${ticker}.` });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      throw new Error(mapDbError(raw));
    }
  };

  const handleToggle = async (alert: Alert, active: boolean) => {
    setBusyId(alert.id);
    setBanner(null);
    try {
      const updated = await setAlertActive(alert.id, active);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      setBanner({ type: "error", text: mapDbError(raw) });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (alert: Alert) => {
    const confirmed = window.confirm(
      `¿Eliminar la alerta de ${alert.ticker} (${alert.preset_or_custom})? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setBusyId(alert.id);
    setBanner(null);
    try {
      await deleteAlert(alert.id);
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      setBanner({ type: "success", text: `Alerta de ${alert.ticker} eliminada.` });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      setBanner({ type: "error", text: mapDbError(raw) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="app-shell">
      <main className="app-container">
        <header className="page-header">
          <div>
            <h1 className="page-header__title">Mis alertas</h1>
            <p className="page-header__subtitle">
              Monitoreo técnico en velas de 15 min. Notificaciones por correo con candle-lock.
            </p>
          </div>
          <div className="page-header__meta">
            <span
              className={`ticker-counter ${atTickerLimit ? "ticker-counter--warning" : ""}`.trim()}
            >
              {uniqueTickers} / {MAX_UNIQUE_TICKERS} tickers activos
            </span>
            <Button onClick={() => setFormOpen(true)}>Nueva alerta</Button>
          </div>
        </header>

        {banner ? <Banner variant={banner.type} message={banner.text} /> : null}

        {loading ? (
          <AlertListSkeleton />
        ) : alerts.length === 0 ? (
          <EmptyState onCreate={() => setFormOpen(true)} />
        ) : (
          <section className="alert-list" aria-label="Listado de alertas">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                busy={busyId === alert.id}
                onToggle={(active) => void handleToggle(alert, active)}
                onDelete={() => void handleDelete(alert)}
              />
            ))}
          </section>
        )}

        <AlertFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
      </main>
    </div>
  );
}
