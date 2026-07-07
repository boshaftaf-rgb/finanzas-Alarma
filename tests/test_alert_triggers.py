"""Tests de triggers de límites en tabla alerts (issue #4 Fase 2a)."""
from __future__ import annotations

import uuid
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
V1_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000099")


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    env_path = ROOT / ".env"
    if not env_path.exists():
        return env
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def get_connection():
    psycopg2 = pytest.importorskip("psycopg2")
    database_url = load_env().get("DATABASE_URL", "")
    if not database_url:
        pytest.skip("Falta DATABASE_URL en .env")
    return psycopg2.connect(database_url)


@pytest.fixture
def db_conn():
    conn = get_connection()
    conn.autocommit = False
    yield conn
    conn.rollback()
    conn.close()


def insert_alert(cur, *, user_id: uuid.UUID, ticker: str, active: bool = True) -> None:
    cur.execute(
        """
        INSERT INTO public.alerts (user_id, ticker, preset_or_custom, params, active)
        VALUES (%s, %s, 'ema_cross_bull', '{}'::jsonb, %s)
        """,
        (str(user_id), ticker, active),
    )


def test_max_five_active_alerts_per_ticker(db_conn):
    cur = db_conn.cursor()
    for i in range(5):
        insert_alert(cur, user_id=TEST_USER_ID, ticker="ZZZZ", active=True)

    with pytest.raises(Exception, match="5 alertas activas"):
        insert_alert(cur, user_id=TEST_USER_ID, ticker="ZZZZ", active=True)

    db_conn.rollback()


def test_inactive_alerts_do_not_count_toward_per_ticker_limit(db_conn):
    cur = db_conn.cursor()
    for i in range(5):
        insert_alert(cur, user_id=TEST_USER_ID, ticker="YYYY", active=True)

    insert_alert(cur, user_id=TEST_USER_ID, ticker="YYYY", active=False)
    db_conn.rollback()


def test_max_fifteen_unique_active_tickers(db_conn):
    cur = db_conn.cursor()
    for i in range(15):
        ticker = f"T{i:02d}"
        insert_alert(cur, user_id=TEST_USER_ID, ticker=ticker, active=True)

    with pytest.raises(Exception, match="15 tickers"):
        insert_alert(cur, user_id=TEST_USER_ID, ticker="T99", active=True)

    db_conn.rollback()


def test_reactivating_existing_ticker_within_limit(db_conn):
    cur = db_conn.cursor()
    for i in range(15):
        ticker = f"U{i:02d}"
        insert_alert(cur, user_id=TEST_USER_ID, ticker=ticker, active=True)

    cur.execute(
        """
        UPDATE public.alerts
        SET active = false
        WHERE user_id = %s AND ticker = 'U00'
        """,
        (str(TEST_USER_ID),),
    )
    insert_alert(cur, user_id=TEST_USER_ID, ticker="U00", active=True)
    db_conn.rollback()


def test_seed_alerts_exist(db_conn):
    cur = db_conn.cursor()
    cur.execute(
        """
        SELECT COUNT(*) FROM public.alerts
        WHERE user_id = %s AND active = true
        """,
        (str(V1_USER_ID),),
    )
    count = cur.fetchone()[0]
    assert count == 3
