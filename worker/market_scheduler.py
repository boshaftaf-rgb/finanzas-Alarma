"""Ventana de horario de mercado NYSE (lun–vie 9:30–16:00 EST)."""
from __future__ import annotations

from datetime import datetime, time
from zoneinfo import ZoneInfo

EST = ZoneInfo("America/New_York")
MARKET_OPEN = time(9, 30)
MARKET_CLOSE = time(16, 0)


def is_market_open(moment: datetime) -> bool:
    """True si el instante cae en horario de mercado (sin feriados NYSE en v1)."""
    local = moment.astimezone(EST)
    if local.weekday() >= 5:
        return False
    current_time = local.time()
    return MARKET_OPEN <= current_time < MARKET_CLOSE
