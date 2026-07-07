# Stock Alerts (finanzas-Alarma)

Plataforma de alertas técnicas sobre acciones de EE. UU.: el worker evalúa EMA/RSI en velas de 15 min y envía correos cuando se cumplen las condiciones.

Documentación principal:

- [PRD](docs/PRD.md) — requisitos y decisiones de producto
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — arquitectura, esquema y flujos
- [Orden de implementación](docs/issues/00-orden-implementacion.md) — roadmap por issues

## Primer paso: servicios externos

Antes de código de producto, provisiona Supabase, Twelve Data y Gmail SMTP:

**→ [Guía de provisioning](docs/provisioning.md)**

Copia la plantilla de entorno:

```bash
cp .env.example .env
```

Rellena `.env` con tus claves reales. No subas ese archivo a git.

## Migraciones (issue #4)

Con `DATABASE_URL` en `.env`:

```bash
pip install -r requirements-dev.txt
python scripts/apply_migrations.py
pytest tests/test_alert_triggers.py -v
```

Guía completa: [docs/supabase-migrations.md](docs/supabase-migrations.md)

## Estructura prevista

```
finanzas-Alarma/
├── frontend/              # React + Vite (Fase 3)
├── worker/                # Python + Docker
├── supabase/migrations/   # Esquema PostgreSQL
├── scripts/               # Utilidades (p. ej. verify_services.py)
├── docker-compose.yml
└── .env.example
```
