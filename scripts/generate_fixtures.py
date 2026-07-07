"""Genera fixtures OHLCV para evaluación local del worker."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from worker.alert_evaluator import AlertEvaluator
from worker.indicator_engine import IndicatorEngine

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "worker" / "fixtures"

def _base_timestamps(count: int) -> list[datetime]:
    start = datetime(2026, 3, 2, 14, 30, tzinfo=timezone.utc)  # lun 9:30 EST
    return [start + timedelta(minutes=15 * i) for i in range(count)]


def _ohlcv_row(ts: datetime, close: float) -> dict:
    return {
        "datetime": ts.isoformat(),
        "open": close - 0.2,
        "high": close + 0.3,
        "low": close - 0.4,
        "close": close,
        "volume": 100_000,
    }


def _write_fixture(ticker: str, rows: list[dict]) -> None:
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    path = FIXTURES_DIR / f"{ticker}.json"
    path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(f"Escrito {path} ({len(rows)} velas)")


def _find_bull_cross_closes(base_len: int = 50) -> list[float]:
    base = [150.0 - i * 0.8 for i in range(base_len)]
    for jump in range(3, 120):
        closes = base + [base[-1] + jump]
        enriched = IndicatorEngine().enrich(_df_from_closes(closes))
        current = enriched.iloc[-1]
        previous = enriched.iloc[-2]
        if previous["ema_9"] <= previous["ema_21"] and current["ema_9"] > current["ema_21"]:
            return closes
    for steps in ((5, 5, 30), (10, 10, 10), (2, 2, 2, 40)):
        closes = base[:]
        for step in steps:
            closes.append(closes[-1] + step)
        enriched = IndicatorEngine().enrich(_df_from_closes(closes))
        current = enriched.iloc[-1]
        previous = enriched.iloc[-2]
        if previous["ema_9"] <= previous["ema_21"] and current["ema_9"] > current["ema_21"]:
            return closes
    raise RuntimeError("No se pudo construir serie con cruce alcista.")


def _find_bear_cross_closes(base_len: int = 50) -> list[float]:
    base = [80.0 + i * 0.8 for i in range(base_len)]
    for drop in range(3, 120):
        closes = base + [base[-1] - drop]
        enriched = IndicatorEngine().enrich(_df_from_closes(closes))
        current = enriched.iloc[-1]
        previous = enriched.iloc[-2]
        if previous["ema_9"] >= previous["ema_21"] and current["ema_9"] < current["ema_21"]:
            return closes
    for steps in ((5, 5, 30), (10, 10, 10), (2, 2, 2, 40)):
        closes = base[:]
        for step in steps:
            closes.append(closes[-1] - step)
        enriched = IndicatorEngine().enrich(_df_from_closes(closes))
        current = enriched.iloc[-1]
        previous = enriched.iloc[-2]
        if previous["ema_9"] >= previous["ema_21"] and current["ema_9"] < current["ema_21"]:
            return closes
    raise RuntimeError("No se pudo construir serie con cruce bajista.")


def _find_rsi_closes(target: str) -> list[float]:
    closes = [200.0]
    for factor in (0.99, 0.985, 0.98, 0.975, 0.97):
        closes = [200.0]
        for _ in range(60):
            closes.append(closes[-1] * factor)
        df = _df_from_closes(closes)
        result = AlertEvaluator().evaluate(
            {"ticker": "X", "preset_or_custom": target, "params": {}},
            df,
        )
        if result.condition_met:
            return closes
    raise RuntimeError(f"No se pudo construir serie RSI para {target}.")


def _find_golden_cross_closes() -> list[float]:
    for decline in (0.1, 0.2, 0.3, 0.4, 0.5):
        for rally in (1.0, 2.0, 3.0, 5.0, 8.0, 10.0, 15.0):
            for n_base in (200, 220, 240):
                for n_rally in (20, 30, 40, 50, 60):
                    base = [900.0 - i * decline for i in range(n_base)]
                    closes = base + [base[-1] + rally * i for i in range(1, n_rally + 1)]
                    result = AlertEvaluator().evaluate(
                        {"ticker": "X", "preset_or_custom": "golden_cross", "params": {}},
                        _df_from_closes(closes),
                    )
                    if result.condition_met:
                        return closes
    raise RuntimeError("No se pudo construir serie golden_cross.")


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


def _build_aapl_bull_cross() -> list[dict]:
    closes = _find_bull_cross_closes()
    timestamps = _base_timestamps(len(closes))
    return [_ohlcv_row(ts, close) for ts, close in zip(timestamps, closes)]


def _build_msft_rsi_oversold() -> list[dict]:
    closes = _find_rsi_closes("rsi_oversold")
    timestamps = _base_timestamps(len(closes))
    return [_ohlcv_row(ts, close) for ts, close in zip(timestamps, closes)]


def _build_nvda_golden_cross() -> list[dict]:
    closes = _find_golden_cross_closes()
    timestamps = _base_timestamps(len(closes))
    return [_ohlcv_row(ts, close) for ts, close in zip(timestamps, closes)]


def _assert_fixture(ticker: str, preset: str) -> None:
    df = pd.DataFrame(json.loads((FIXTURES_DIR / f"{ticker}.json").read_text()))
    df["datetime"] = pd.to_datetime(df["datetime"], utc=True)
    df = df.set_index("datetime")
    result = AlertEvaluator().evaluate(
        {"ticker": ticker, "preset_or_custom": preset, "params": {}},
        df,
    )
    if not result.condition_met:
        raise RuntimeError(f"Fixture {ticker} no dispara {preset}")


def main() -> None:
    fixtures = {
        "AAPL": ("ema_cross_bull", _build_aapl_bull_cross()),
        "MSFT": ("rsi_oversold", _build_msft_rsi_oversold()),
        "NVDA": ("golden_cross", _build_nvda_golden_cross()),
    }
    for ticker, (preset, rows) in fixtures.items():
        _write_fixture(ticker, rows)
        _assert_fixture(ticker, preset)
    print("Fixtures generados y validados.")


if __name__ == "__main__":
    main()
