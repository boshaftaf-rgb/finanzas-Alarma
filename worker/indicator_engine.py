"""Cálculo de indicadores EMA y RSI sobre OHLCV."""
from __future__ import annotations

import pandas as pd


REQUIRED_COLUMNS = ("open", "high", "low", "close", "volume")


def validate_ohlcv(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Faltan columnas OHLCV: {', '.join(missing)}")
    if df.empty:
        raise ValueError("El DataFrame OHLCV está vacío.")


def compute_ema(close: pd.Series, length: int) -> pd.Series:
    return close.ewm(span=length, adjust=False).mean()


def compute_rsi(close: pd.Series, length: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


class IndicatorEngine:
    """Calcula EMA y RSI sobre velas de 15 min."""

    def enrich(self, df: pd.DataFrame) -> pd.DataFrame:
        validate_ohlcv(df)
        enriched = df.copy()
        close = enriched["close"]
        enriched["ema_9"] = compute_ema(close, 9)
        enriched["ema_21"] = compute_ema(close, 21)
        enriched["ema_50"] = compute_ema(close, 50)
        enriched["ema_200"] = compute_ema(close, 200)
        enriched["rsi_14"] = compute_rsi(close, 14)
        return enriched

    def ema(self, df: pd.DataFrame, length: int) -> pd.Series:
        validate_ohlcv(df)
        return compute_ema(df["close"], length)

    def rsi(self, df: pd.DataFrame, length: int = 14) -> pd.Series:
        validate_ohlcv(df)
        return compute_rsi(df["close"], length)
