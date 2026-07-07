## Parent

#1

## Prioridad

**Fase 2e** (Vercel Cron) — orden #6 — implementar **ahora** tras #8.

**Fase 3c** (panel en Vercel) — orden #9 — implementar **después** del panel (#4 Fase 3a, #5).

## What to build

Poner Stock Alerts en modo operación en la nube (sin PC local).

### Fase 2e — Worker en Vercel (ahora)

- `vercel.json` con cron cada 5 min → `api/cron/evaluate`.
- Variables server-side en Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, SMTP, Twelve Data.
- Logs del worker en español.
- README operador: [docs/vercel-deploy.md](../vercel-deploy.md).

Verificable: cron evalúa alertas en horario de mercado; papá recibe emails.

### Fase 3c — Panel en Vercel (después)

- Build `frontend/` en el mismo proyecto Vercel.
- Env `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Verificable: panel accesible por URL; crear alerta → cron evalúa → email recibido.

## Acceptance criteria

### Fase 2e (requerida ahora)

- [ ] Cron Vercel invoca `/api/cron/evaluate` cada 5 min
- [ ] `CRON_SECRET` protege el endpoint
- [ ] Logs operativos en español
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo en env server-side Vercel
- [ ] Flujo verificado: alerta seed → cron evalúa → papá recibe email

### Fase 3c (después del panel)

- [ ] Frontend desplegado y accesible por URL
- [ ] Flujo end-to-end desde el panel

## Blocked by

- **Fase 2e:** #8 (Gmail + candle-lock)
- **Fase 3c:** #5

## Nota

Decisión ADR 001: worker en TypeScript serverless; `worker/` Python queda para dev local.
