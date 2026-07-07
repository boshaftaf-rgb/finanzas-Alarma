"""Tests unitarios de IndicatorEngine."""
from __future__ import annotations

import pandas as pd
import pytest

from worker.indicator_engine import IndicatorEngine


@pytest.fixture
def sample_ohlcv() -> pd.DataFrame:
    closes = [100 + i * 0.5 for i in range(30)]
    index = pd.date_range("2026-03-02 14:30:00", periods=30, freq="15min", tz="UTC")
    return pd.DataFrame(
        {
            "open": closes,
            "high": [c + 1 for c in closes],
            "low": [c - 1 for c in closes],
            "close": closes,
            "volume": [10_000] * 30,
        },
        index=index,
    )


def test_enrich_adds_ema_and_rsi_columns(sample_ohlcv: pd.DataFrame) -> None:
    enriched = IndicatorEngine().enrich(sample_ohlcv)
    for col in ("ema_9", "ema_21", "ema_50", "ema_200", "rsi_14"):
        assert col in enriched.columns
    assert enriched["ema_9"].iloc[-1] == pytest.approx(enriched["close"].ewm(span=9, adjust=False).mean().iloc[-1])


def test_enrich_requires_ohlcv_columns() -> None:
    df = pd.DataFrame({"close": [1, 2, 3]})
    with pytest.raises(ValueError, match="Faltan columnas OHLCV"):
        IndicatorEngine().enrich(df)
