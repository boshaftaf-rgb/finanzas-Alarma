"""Evaluación de condiciones de alerta sobre indicadores calculados."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import pandas as pd

from worker.indicator_engine import IndicatorEngine


@dataclass(frozen=True)
class EvaluationResult:
    condition_met: bool
    candle_timestamp: datetime
    preset_or_custom: str
    ticker: str


def _latest_valid_row(df: pd.DataFrame) -> pd.Series:
    if len(df) < 2:
        raise ValueError("Se necesitan al menos 2 velas para evaluar una alerta.")
    return df.iloc[-1]


def _previous_row(df: pd.DataFrame) -> pd.Series:
    return df.iloc[-2]


def _ema_cross(
    prev_fast: float,
    prev_slow: float,
    fast: float,
    slow: float,
    *,
    direction: str,
) -> bool:
    if direction == "up":
        return prev_fast <= prev_slow and fast > slow
    if direction == "down":
        return prev_fast >= prev_slow and fast < slow
    raise ValueError(f"Dirección EMA no soportada: {direction}")


def _rsi_threshold(value: float, threshold: float, operator: str) -> bool:
    if operator == "<":
        return value < threshold
    if operator == ">":
        return value > threshold
    raise ValueError(f"Operador RSI no soportado: {operator}")


class AlertEvaluator:
    """Evalúa si la condición técnica de una alerta se cumple en la vela más reciente."""

    def __init__(self, engine: IndicatorEngine | None = None) -> None:
        self._engine = engine or IndicatorEngine()

    def evaluate(
        self,
        alert: dict[str, Any],
        ohlcv: pd.DataFrame,
    ) -> EvaluationResult:
        enriched = self._engine.enrich(ohlcv)
        current = _latest_valid_row(enriched)
        previous = _previous_row(enriched)
        preset = alert["preset_or_custom"]
        ticker = alert["ticker"]
        candle_ts = pd.Timestamp(current.name).to_pydatetime()

        condition_met = self._evaluate_preset(
            preset=preset,
            params=alert.get("params") or {},
            current=current,
            previous=previous,
            ohlcv=enriched,
        )

        return EvaluationResult(
            condition_met=condition_met,
            candle_timestamp=candle_ts,
            preset_or_custom=preset,
            ticker=ticker,
        )

    def _evaluate_preset(
        self,
        *,
        preset: str,
        params: dict[str, Any],
        current: pd.Series,
        previous: pd.Series,
        ohlcv: pd.DataFrame,
    ) -> bool:
        if preset == "ema_cross_bull":
            return _ema_cross(
                previous["ema_9"],
                previous["ema_21"],
                current["ema_9"],
                current["ema_21"],
                direction="up",
            )
        if preset == "ema_cross_bear":
            return _ema_cross(
                previous["ema_9"],
                previous["ema_21"],
                current["ema_9"],
                current["ema_21"],
                direction="down",
            )
        if preset == "golden_cross":
            return _ema_cross(
                previous["ema_50"],
                previous["ema_200"],
                current["ema_50"],
                current["ema_200"],
                direction="up",
            )
        if preset == "death_cross":
            return _ema_cross(
                previous["ema_50"],
                previous["ema_200"],
                current["ema_50"],
                current["ema_200"],
                direction="down",
            )
        if preset == "rsi_oversold":
            return _rsi_threshold(current["rsi_14"], 30, "<")
        if preset == "rsi_overbought":
            return _rsi_threshold(current["rsi_14"], 70, ">")
        if preset == "custom":
            return self._evaluate_custom(params, current, previous, ohlcv)
        raise ValueError(f"Preset no soportado: {preset}")

    def _evaluate_custom(
        self,
        params: dict[str, Any],
        current: pd.Series,
        previous: pd.Series,
        ohlcv: pd.DataFrame,
    ) -> bool:
        alert_type = params.get("type")
        if alert_type == "ema":
            fast_len = int(params["ema_fast"])
            slow_len = int(params["ema_slow"])
            direction = params["direction"]
            fast_col = f"ema_{fast_len}"
            slow_col = f"ema_{slow_len}"
            if fast_col not in ohlcv.columns or slow_col not in ohlcv.columns:
                ohlcv = ohlcv.copy()
                ohlcv[fast_col] = self._engine.ema(ohlcv, fast_len)
                ohlcv[slow_col] = self._engine.ema(ohlcv, slow_len)
                current = ohlcv.iloc[-1]
                previous = ohlcv.iloc[-2]
            return _ema_cross(
                previous[fast_col],
                previous[slow_col],
                current[fast_col],
                current[slow_col],
                direction=direction,
            )
        if alert_type == "rsi":
            period = int(params.get("period", 14))
            rsi_col = f"rsi_{period}"
            if rsi_col not in ohlcv.columns:
                ohlcv = ohlcv.copy()
                ohlcv[rsi_col] = self._engine.rsi(ohlcv, period)
                current = ohlcv.iloc[-1]
            return _rsi_threshold(
                current[rsi_col],
                float(params["threshold"]),
                params["operator"],
            )
        raise ValueError("Alerta custom sin tipo válido (ema o rsi).")
