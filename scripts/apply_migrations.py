"""Aplica migraciones y seed SQL al proyecto Supabase remoto.

Requiere DATABASE_URL en .env (Dashboard → Project Settings → Database → URI).
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "supabase" / "migrations"
SEED_FILE = ROOT / "supabase" / "seed.sql"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def read_sql_files() -> list[tuple[str, str]]:
    files: list[tuple[str, str]] = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        files.append((path.name, path.read_text(encoding="utf-8")))
    if SEED_FILE.exists():
        files.append(("seed.sql", SEED_FILE.read_text(encoding="utf-8")))
    return files


def main() -> int:
    try:
        import psycopg2
    except ImportError:
        print("Instala dependencia: pip install psycopg2-binary")
        return 1

    env = load_env(ROOT / ".env")
    database_url = env.get("DATABASE_URL", "")
    if not database_url:
        print("Falta DATABASE_URL en .env")
        print("Supabase Dashboard → Project Settings → Database → Connection string → URI")
        return 1

    sql_files = read_sql_files()
    if not sql_files:
        print("No hay archivos SQL en supabase/migrations/")
        return 1

    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            for name, sql in sql_files:
                print(f"Aplicando {name}...")
                cur.execute(sql)
                print(f"  OK")
    finally:
        conn.close()

    print("Migraciones y seed aplicados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
