import { Badge } from "./Badge";
import { Button } from "./Button";
import { Toggle } from "./Toggle";
import { formatEvaluatedAt } from "../lib/format";
import { presetKind, presetLabel } from "../lib/presets";
import type { Alert } from "../lib/types";

interface AlertRowProps {
  alert: Alert;
  busy?: boolean;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

export function AlertRow({ alert, busy, onToggle, onDelete }: AlertRowProps) {
  const kind = presetKind(alert.preset_or_custom);
  const kindBadge = kind === "ema" ? "ema" : kind === "rsi" ? "rsi" : null;

  return (
    <article
      className={`alert-row ${alert.active ? "" : "alert-row--inactive"}`.trim()}
      aria-label={`Alerta ${alert.ticker}`}
    >
      <div className="alert-row__ticker">{alert.ticker}</div>
      <div>
        <div className="alert-row__preset">
          {presetLabel(alert.preset_or_custom)}
          {kindBadge ? (
            <>
              {" "}
              <Badge variant={kindBadge}>{kindBadge === "ema" ? "EMA" : "RSI"}</Badge>
            </>
          ) : null}
        </div>
        <div className="alert-row__meta">
          Última evaluación: {formatEvaluatedAt(alert.last_evaluated_at)}
        </div>
      </div>
      <Badge variant={alert.active ? "active" : "inactive"}>
        {alert.active ? "Activa" : "Inactiva"}
      </Badge>
      <div className="alert-row__actions">
        <Toggle
          checked={alert.active}
          disabled={busy}
          label={
            alert.active ? `Desactivar alerta ${alert.ticker}` : `Activar alerta ${alert.ticker}`
          }
          onChange={onToggle}
        />
        <Button
          variant="ghost"
          disabled={busy}
          onClick={onDelete}
          aria-label={`Eliminar alerta ${alert.ticker}`}
        >
          Eliminar
        </Button>
      </div>
    </article>
  );
}
