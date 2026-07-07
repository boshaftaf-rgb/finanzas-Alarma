# Stock Alerts (finanzas-Alarma)

Plataforma de alertas técnicas sobre acciones de EE. UU.: el worker evalúa EMA/RSI en velas de 15 min y envía correos cuando se cumplen las condiciones.

Documentación principal:

- [PRD](docs/PRD.md) — requisitos y decisiones de producto
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — arquitectura, esquema y flujos
- [Deploy Vercel](docs/vercel-deploy.md) — panel + worker cron
- [ADR 001 — Worker en Vercel](docs/adr/001-worker-en-vercel.md)
- [Orden de implementación](docs/issues/00-orden-implementacion.md)

## Stack (v1)

| Pieza | Dónde |
|-------|--------|
| Panel | Vercel (`frontend/`) |
| Worker | Vercel Cron (`api/cron/evaluate` + `lib/`) |
| Base de datos | Supabase |

## Estructura

```
finanzas-Alarma/
├── api/cron/              # Worker serverless
├── lib/                   # EMA, RSI, evaluador
├── frontend/              # React + Vite
├── worker/                # Python — solo dev local
├── supabase/migrations/
├── vercel.json
└── .env.example
```

## Desarrollo local

```bash
cp .env.example .env
npm install
npm test
```

Worker TypeScript (tests): `npm test`  
Worker Python (opcional): ver [worker/README.md](worker/README.md)

## Deploy

**→ [Guía de deploy en Vercel](docs/vercel-deploy.md)**

Provisioning de servicios: [docs/provisioning.md](docs/provisioning.md)
