import { useEffect, useState } from "react";
import type { PresetId } from "../lib/types";
import { PRESETS } from "../lib/presets";
import { normalizeTicker, validateTicker } from "../lib/ticker-validation";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface AlertFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ticker: string, preset: PresetId) => Promise<void>;
}

export function AlertFormModal({ open, onClose, onSubmit }: AlertFormModalProps) {
  const [ticker, setTicker] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTicker("");
    setSelectedPreset(null);
    setTickerError(null);
    setFormError(null);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleTickerBlur = () => {
    if (!ticker.trim()) {
      setTickerError(null);
      return;
    }
    setTickerError(validateTicker(ticker));
  };

  const handlePresetSelect = (id: PresetId) => {
    setSelectedPreset(id);
    setFormError(null);
  };

  const handleSubmit = async () => {
    const tickerValidation = validateTicker(ticker);
    setTickerError(tickerValidation);
    if (tickerValidation) return;
    if (!selectedPreset) {
      setFormError("Selecciona un preset de alerta.");
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      await onSubmit(normalizeTicker(ticker), selectedPreset);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear la alerta.";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !loading && onClose()}>
      <div
        className="card modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="alert-form-title" className="modal__title">
          Nueva alerta
        </h2>
        <p className="modal__subtitle">Timeframe fijo: 15 minutos. Máx. 5 alertas activas por ticker.</p>

        <div className="form-field">
          <label className="form-field__label" htmlFor="ticker-input">
            Ticker
          </label>
          <input
            id="ticker-input"
            className={`input-text ${tickerError ? "input-text--error" : ""}`.trim()}
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value.toUpperCase());
              setTickerError(null);
            }}
            onBlur={handleTickerBlur}
            placeholder="AAPL"
            autoComplete="off"
            spellCheck={false}
            maxLength={10}
          />
          <p className="form-field__hint">Símbolo de EE. UU. en mayúsculas (ej. MSFT, NVDA).</p>
          {tickerError ? <p className="form-field__error">{tickerError}</p> : null}
        </div>

        <div className="form-field">
          <span className="form-field__label">Preset</span>
          <div className="preset-grid" role="listbox" aria-label="Presets de alerta">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`preset-card ${isSelected ? "is-selected" : ""}`.trim()}
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  <span className="preset-card__name">{preset.name}</span>
                  <span className="preset-card__desc">{preset.description}</span>
                  <Badge variant={preset.kind === "ema" ? "ema" : "rsi"}>
                    {preset.kind === "ema" ? "EMA" : "RSI"}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {formError ? <p className="form-field__error">{formError}</p> : null}

        <div className="modal__footer">
          <Button variant="secondary" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={() => void handleSubmit()}>
            Crear alerta
          </Button>
        </div>
      </div>
    </div>
  );
}
