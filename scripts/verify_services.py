"""Verificación puntual de servicios externos (issue #2). No imprime secretos."""
from __future__ import annotations

import smtplib
import ssl
import urllib.error
import urllib.request
from pathlib import Path


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def main() -> int:
    env = load_env(Path(".env"))
    failures = 0

    # Supabase (anon key contra /auth/v1/health; /rest/v1/ raíz exige service_role)
    base = env.get("SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_ANON_KEY", "")
    req = urllib.request.Request(
        f"{base}/auth/v1/health",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            print(f"Supabase: OK — HTTP {response.status}")
    except urllib.error.HTTPError as exc:
        if exc.code in (200, 404):
            print(f"Supabase: OK — HTTP {exc.code}")
        else:
            print(f"Supabase: FAIL — HTTP {exc.code}")
            failures += 1
    except Exception as exc:
        print(f"Supabase: FAIL — {type(exc).__name__}: {exc}")
        failures += 1

    # Twelve Data
    td_key = env.get("TWELVE_DATA_API_KEY", "")
    td_url = (
        "https://api.twelvedata.com/time_series"
        f"?symbol=AAPL&interval=15min&outputsize=1&apikey={td_key}"
    )
    try:
        with urllib.request.urlopen(td_url, timeout=15) as response:
            body = response.read().decode("utf-8", errors="replace")
        if '"status":"error"' in body:
            print(f"Twelve Data: FAIL — respuesta de error de API")
            failures += 1
        elif '"values"' in body or '"meta"' in body:
            print("Twelve Data: OK — respuesta valida")
        else:
            print("Twelve Data: FAIL — respuesta inesperada")
            failures += 1
    except Exception as exc:
        print(f"Twelve Data: FAIL — {type(exc).__name__}: {exc}")
        failures += 1

    # Gmail SMTP
    host = env.get("SMTP_HOST", "smtp.gmail.com")
    port = int(env.get("SMTP_PORT", "587"))
    user = env.get("SMTP_USER", "")
    pwd = env.get("SMTP_APP_PASSWORD", "").replace(" ", "")
    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
            smtp.login(user, pwd)
        print("Gmail SMTP: OK — login exitoso")
    except Exception as exc:
        print(f"Gmail SMTP: FAIL — {type(exc).__name__}: {exc}")
        failures += 1

    return failures


if __name__ == "__main__":
    raise SystemExit(main())
