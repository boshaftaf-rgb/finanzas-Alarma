"""Carga de configuración desde variables de entorno."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


@dataclass(frozen=True)
class WorkerConfig:
    supabase_url: str
    supabase_service_role_key: str

    @classmethod
    def from_env(cls) -> WorkerConfig:
        root = Path(__file__).resolve().parents[1]
        _load_dotenv(root / ".env")
        url = os.environ.get("SUPABASE_URL", "").strip()
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        if not url or not key:
            raise ValueError(
                "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
            )
        return cls(supabase_url=url, supabase_service_role_key=key)
