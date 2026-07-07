"""Tests unitarios de MarketScheduler."""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from worker.market_scheduler import is_market_open

UTC = ZoneInfo("UTC")
EST = ZoneInfo("America/New_York")


@pytest.mark.parametrize(
    ("moment", "expected"),
    [
        (datetime(2026, 3, 7, 15, 0, tzinfo=UTC), False),  # sábado
        (datetime(2026, 3, 6, 21, 1, tzinfo=UTC), False),  # viernes 16:01 EST
        (datetime(2026, 3, 2, 14, 29, tzinfo=UTC), False),  # lunes 9:29 EST
        (datetime(2026, 3, 4, 17, 0, tzinfo=UTC), True),  # miércoles 12:00 EST
        (datetime(2026, 3, 2, 14, 30, tzinfo=UTC), True),  # lunes 9:30 EST
    ],
)
def test_is_market_open(moment: datetime, expected: bool) -> None:
    assert is_market_open(moment) is expected
