# Deploy en Vercel (panel + worker) — $0

Decisión: [ADR 001](adr/001-worker-en-vercel.md).  
**Scheduler:** [GitHub Actions](https://github.com/features/actions) (gratis), no Vercel Cron (de pago).

## Qué se despliega

| Ruta / pieza | Rol |
|--------------|-----|
| `frontend/` | Panel estático (HTML + CSS + JS, sin npm) |
| `api/cron/evaluate` | Worker — evalúa alertas (invocado por HTTP) |
| `lib/` | Lógica compartida (EMA, RSI, evaluador) |
| `.github/workflows/evaluate-alerts.yml` | Cron gratuito cada 5 min (lun–vie) |

## Paso a paso (operador)

### 1. Deploy en Vercel

1. Importa el repo en [vercel.com](https://vercel.com).
2. Añade las variables de entorno (ver tabla abajo).
3. Deploy y copia la URL de producción (ej. `https://finanzas-alarma.vercel.app`).

### 2. Secrets en GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|--------|
| `VERCEL_APP_URL` | URL de producción **sin** barra final (ej. `https://finanzas-alarma.vercel.app`) |
| `CRON_SECRET` | Mismo string largo que en Vercel |

### 3. Probar manualmente

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  "https://TU-URL.vercel.app/api/cron/evaluate?once=true"
```

O en GitHub → **Actions → Evaluar alertas → Run workflow**.

### 4. Automático

El workflow corre cada **5 minutos** de lunes a viernes. Fuera del horario NY (9:30–16:00) el worker responde `mercado_cerrado` y sale rápido.

## Variables en Vercel

**Project Settings → Environment Variables**

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | Worker |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker — **nunca** en `VITE_*` |
| `TWELVE_DATA_API_KEY` | Worker (issue #7) |
| `SMTP_*`, `ALERT_RECIPIENT_EMAIL` | Worker (issue #8) |
| `CRON_SECRET` | Protege el endpoint |
| `WORKER_USE_FIXTURES` | `true` hasta #7; luego `false` |
| `VITE_SUPABASE_URL` | Frontend (fase 3) |
| `VITE_SUPABASE_ANON_KEY` | Frontend (fase 3) |

## Coste

| Servicio | Coste |
|----------|--------|
| Vercel Hobby | $0 (funciones serverless dentro del free tier) |
| Supabase free | $0 |
| Twelve Data free | $0 |
| Gmail | $0 |
| GitHub Actions | $0 en repo **público**; repo privado: ~500 min/mes suele bastar |

**No uses** Vercel Cron (requiere plan de pago para cada 5 min).

## Alternativa si GitHub Actions no alcanza (repo privado)

- [cron-job.org](https://cron-job.org) (plan gratuito): una petición HTTP GET/POST a tu URL con header `Authorization: Bearer CRON_SECRET` cada 5 min.

## `worker/` Python

Solo desarrollo local. Producción = `api/` + `lib/` en Vercel.
