"""Punto de entrada del worker."""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime, timezone

from worker.alert_evaluator import AlertEvaluator
from worker.alert_store import AlertStore
from worker.config import WorkerConfig
from worker.fixture_loader import load_fixture
from worker.market_scheduler import is_market_open

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("worker")


def run_once() -> int:
    config = WorkerConfig.from_env()
    store = AlertStore(config.supabase_url, config.supabase_service_role_key)
    evaluator = AlertEvaluator()
    now = datetime.now(timezone.utc)

    alerts = store.fetch_active_alerts()
    if not alerts:
        logger.info("No hay alertas activas para evaluar.")
        return 0

    logger.info("Evaluando %d alerta(s) activa(s) con datos fixture.", len(alerts))

    for alert in alerts:
        alert_id = alert["id"]
        ticker = alert["ticker"]
        preset = alert["preset_or_custom"]

        try:
            ohlcv = load_fixture(ticker)
            result = evaluator.evaluate(alert, ohlcv)
        except FileNotFoundError as exc:
            logger.warning(
                "Alerta %s (%s): sin fixture — %s",
                ticker,
                preset,
                exc,
            )
            store.update_last_evaluated(alert_id, now)
            continue
        except Exception as exc:
            logger.error(
                "Alerta %s (%s): error al evaluar — %s",
                ticker,
                preset,
                exc,
            )
            continue

        outcome = "DISPARARÍA" if result.condition_met else "NO DISPARARÍA"
        logger.info(
            "Alerta %s | ticker=%s | preset=%s | vela=%s | resultado=%s",
            alert_id,
            ticker,
            preset,
            result.candle_timestamp.isoformat(),
            outcome,
        )
        store.update_last_evaluated(alert_id, now)

    logger.info("Ciclo one-shot completado.")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Worker Stock Alerts")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Evalúa alertas una vez con fixtures y sale.",
    )
    args = parser.parse_args(argv)

    if not args.once:
        now = datetime.now(timezone.utc)
        if not is_market_open(now):
            logger.info("Mercado cerrado. Usa --once para evaluación con fixtures.")
            return 0
        logger.error("Modo loop de producción aún no implementado. Usa --once.")
        return 1

    return run_once()


if __name__ == "__main__":
    raise SystemExit(main())
