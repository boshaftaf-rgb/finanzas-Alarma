"""Carga de fixtures OHLCV por ticker."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def load_fixture(ticker: str) -> pd.DataFrame:
    path = FIXTURES_DIR / f"{ticker.upper()}.json"
    if not path.exists():
        raise FileNotFoundError(f"No hay fixture OHLCV para {ticker}: {path}")

    rows = json.loads(path.read_text(encoding="utf-8"))
    df = pd.DataFrame(rows)
    df["datetime"] = pd.to_datetime(df["datetime"], utc=True)
    df = df.set_index("datetime").sort_index()
    return df
