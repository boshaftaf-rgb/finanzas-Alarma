"""Tests unitarios de AlertEvaluator."""
from __future__ import annotations

import pandas as pd
import pytest

from worker.alert_evaluator import AlertEvaluator, _ema_cross, _rsi_threshold


def _df_from_closes(closes: list[float]) -> pd.DataFrame:
    index = pd.date_range("2026-03-02 14:30:00", periods=len(closes), freq="15min", tz="UTC")
    return pd.DataFrame(
        {
            "open": closes,
            "high": [c + 0.5 for c in closes],
            "low": [c - 0.5 for c in closes],
            "close": closes,
            "volume": [50_000] * len(closes),
        },
        index=index,
    )


def _bull_cross_closes() -> list[float]:
    base = [150.0 - i * 0.8 for i in range(50)]
    for jump in range(50, 120):
        closes = base + [base[-1] + jump]
        result = AlertEvaluator().evaluate(
            {"ticker": "TEST", "preset_or_custom": "ema_cross_bull", "params": {}},
            _df_from_closes(closes),
        )
        if result.condition_met:
            return closes
    closes = base[:]
    for step in (5, 5, 30):
        closes.append(closes[-1] + step)
    return closes


def _bear_cross_closes() -> list[float]:
    base = [80.0 + i * 0.8 for i in range(50)]
    for drop in range(50, 120):
        closes = base + [base[-1] - drop]
        result = AlertEvaluator().evaluate(
            {"ticker": "TEST", "preset_or_custom": "ema_cross_bear", "params": {}},
            _df_from_closes(closes),
        )
        if result.condition_met:
            return closes
    closes = base[:]
    for step in (5, 5, 30):
        closes.append(closes[-1] - step)
    return closes


def test_ema_cross_bull_detected() -> None:
    df = _df_from_closes(_bull_cross_closes())
    alert = {"ticker": "TEST", "preset_or_custom": "ema_cross_bull", "params": {}}
    result = AlertEvaluator().evaluate(alert, df)
    assert result.condition_met


def test_ema_cross_bear_detected() -> None:
    df = _df_from_closes(_bear_cross_closes())
    alert = {"ticker": "TEST", "preset_or_custom": "ema_cross_bear", "params": {}}
    result = AlertEvaluator().evaluate(alert, df)
    assert result.condition_met


def test_rsi_oversold_detected() -> None:
    closes = [200.0]
    for _ in range(60):
        closes.append(closes[-1] * 0.975)
    df = _df_from_closes(closes)
    alert = {"ticker": "TEST", "preset_or_custom": "rsi_oversold", "params": {}}
    result = AlertEvaluator().evaluate(alert, df)
    assert result.condition_met


def test_rsi_overbought_detected() -> None:
    closes = [50.0]
    for _ in range(60):
        closes.append(closes[-1] * 1.025)
    df = _df_from_closes(closes)
    alert = {"ticker": "TEST", "preset_or_custom": "rsi_overbought", "params": {}}
    result = AlertEvaluator().evaluate(alert, df)
    assert result.condition_met


def test_ema_cross_helper() -> None:
    assert _ema_cross(10, 11, 12, 11, direction="up")
    assert _ema_cross(12, 11, 10, 11, direction="down")


def test_rsi_threshold_helper() -> None:
    assert _rsi_threshold(25, 30, "<")
    assert _rsi_threshold(75, 70, ">")
