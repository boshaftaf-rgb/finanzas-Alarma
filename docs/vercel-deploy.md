# Deploy en Vercel (panel + worker) — $0

Decisión: [ADR 001](adr/001-worker-en-vercel.md).  
**Scheduler primario:** [cron-job.org](https://cron-job.org) cada **15 min** (gratis, puntual).  
**Respaldo:** [GitHub Actions](https://github.com/features/actions) cada 15 min (no garantiza puntualidad).  
No uses Vercel Cron (de pago).

## Qué se despliega

| Ruta / pieza | Rol |
|--------------|-----|
| `frontend/` | Panel estático (HTML + CSS + JS, sin gestor de paquetes en el panel) |
| `api/cron/evaluate` | Worker — evalúa alertas (invocado por HTTP) |
| `lib/` | Lógica compartida (EMA, RSI, evaluador) |
| `.github/workflows/evaluate-alerts.yml` | Respaldo cada 15 min (lun–vie) |

## Paso a paso (operador)

### 1. Deploy en Vercel

1. Importa el repo en [vercel.com](https://vercel.com).
2. Añade las variables de entorno (ver tabla abajo).
3. Deploy y copia la URL de producción (ej. `https://finanzas-alarma.vercel.app`).

### 2. Secrets en GitHub (respaldo)

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

### 4. Automático — cron-job.org (primario)

Actions solo no basta: el schedule de GitHub suele retrasarse horas. Configura [cron-job.org](https://cron-job.org) (plan gratuito):

| Campo | Valor |
|-------|--------|
| URL | `https://TU-URL.vercel.app/api/cron/evaluate` |
| Método | GET (o POST; el handler no exige body) |
| Header | `Authorization: Bearer <mismo CRON_SECRET que Vercel>` |
| Intervalo | Cada **15 minutos**, lun–vie |

Fuera del horario NY (9:30–16:00) el worker responde `mercado_cerrado` y sale rápido. Checklist completo: [`TAREAS-HUMANO.md`](../TAREAS-HUMANO.md).

El workflow de Actions queda como **respaldo** cada 15 min (lun–vie).

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
| cron-job.org | $0 (plan gratuito) |
| GitHub Actions | $0 en repo **público**; repo privado: minutos de Actions |

**No uses** Vercel Cron (requiere plan de pago).

## `worker/` Python

Solo desarrollo local. Producción = `api/` + `lib/` en Vercel.
