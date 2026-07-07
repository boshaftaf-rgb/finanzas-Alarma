# Deploy en Vercel (panel + worker)

Decisión: [ADR 001](adr/001-worker-en-vercel.md).

## Qué se despliega

| Ruta / pieza | Rol |
|--------------|-----|
| `frontend/` | Panel React (Fase 3) |
| `api/cron/evaluate` | Worker — evalúa alertas cada 5 min |
| `lib/` | Lógica compartida (EMA, RSI, evaluador) |

## Variables en Vercel (server-side)

Configurar en **Project Settings → Environment Variables**:

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | Worker (cron) |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker — **nunca** en `VITE_*` |
| `TWELVE_DATA_API_KEY` | Worker (issue #7) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_APP_PASSWORD` | Worker (issue #8) |
| `ALERT_RECIPIENT_EMAIL` | Worker |
| `CRON_SECRET` | Protege `/api/cron/evaluate` |
| `WORKER_USE_FIXTURES` | `true` solo en preview/dev; `false` en producción |
| `VITE_SUPABASE_URL` | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Frontend |

## Cron

`vercel.json` programa el worker cada 5 minutos:

```json
{ "path": "/api/cron/evaluate", "schedule": "*/5 * * * *" }
```

Vercel envía `Authorization: Bearer <CRON_SECRET>` en las invocaciones programadas si configuras `CRON_SECRET` en el proyecto.

## Probar manualmente (preview)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://tu-proyecto.vercel.app/api/cron/evaluate?once=true"
```

Con fixtures (antes de Twelve Data #7):

```
WORKER_USE_FIXTURES=true
```

## Plan Vercel

El cron cada **5 minutos** puede requerir **plan Pro** según límites de tu cuenta. Revisa [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs).

## `worker/` Python

Carpeta **legacy / desarrollo local**. Producción = TypeScript en `api/` + `lib/`.
