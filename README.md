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

## Estructura prevista

```
finanzas-Alarma/
├── frontend/              # React + Vite (Fase 3)
├── worker/                # Python + Docker
├── supabase/migrations/   # Esquema PostgreSQL
├── docker-compose.yml
└── .env.example
```
