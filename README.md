# Stock Alerts (finanzas-Alarma)

Plataforma de alertas técnicas sobre acciones de EE. UU.: el worker evalúa EMA/RSI en velas de 15 min y envía correos cuando se cumplen las condiciones.

Documentación principal:

- [Guía de usuario](docs/GUIA-USUARIO.md) — especificaciones y FAQ para perfil financiero
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

### Instalar pnpm (una vez)

Este repo usa **pnpm** (no `npm` / `npx`). Con Node 22+:

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

Si en Windows `corepack enable` falla con **EPERM** (Program Files), instala pnpm en tu usuario:

```powershell
npm install -g pnpm@9.15.9
```

Cierra y vuelve a abrir PowerShell, luego comprueba:

```powershell
pnpm --version
```

Debe mostrar `9.15.9` (o compatible). El comando anterior solo sirve para **instalar el gestor**; el día a día del proyecto es solo con `pnpm`.

### Arrancar el proyecto

```bash
cp .env.example .env
pnpm install
pnpm test
pnpm run dev
```

Abre **http://localhost:3000**. `pnpm run dev` sirve el panel y las rutas `/api/*` (cotizaciones, config).  
Solo estáticos sin API: `pnpm run dev:static` (las cotizaciones fallarán con 404).

Worker TypeScript (tests): `pnpm test`  
Worker Python (opcional): ver [worker/README.md](worker/README.md)

Gestor de paquetes: **pnpm** únicamente (no `npm` / `npx` en scripts del repo). Ver [SECURITY.md](SECURITY.md).

## Deploy

**→ [Guía de deploy en Vercel](docs/vercel-deploy.md)**

Provisioning de servicios: [docs/provisioning.md](docs/provisioning.md)
