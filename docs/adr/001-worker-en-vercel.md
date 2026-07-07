# ADR 001 — Worker en Vercel Cron (TypeScript)

**Estado:** Aceptado  
**Fecha:** 2026-07-07  
**Decisión del operador:** Opción 2 — todo en Vercel, sin depender del PC local.

## Contexto

El PRD original ubicaba el worker en **Docker local** para evitar coste cloud. El operador prefiere que el polling corra **24/7 en la nube** con una experiencia similar a Vercel (git push, variables de entorno, sin PC prendida).

## Decisión

- **Panel:** React + Vite en Vercel (sin cambio).
- **Worker:** función serverless en **`api/cron/evaluate`** disparada por **Vercel Cron** cada 5 minutos.
- **Lógica:** TypeScript en `lib/` (EMA, RSI, evaluador, horario de mercado, Supabase).
- **Secretos server-side en Vercel:** `SUPABASE_SERVICE_ROLE_KEY`, `TWELVE_DATA_API_KEY`, `SMTP_*`, `CRON_SECRET`.
- **Nunca en el bundle del frontend:** `service_role` ni claves SMTP.

## Consecuencias

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Runtime producción | Python + Docker local | TypeScript serverless (Vercel) |
| Disponibilidad | PC + Docker encendidos | Vercel 24/7 |
| Coste infra worker | 0 € (PC local) | Plan Vercel (cron frecuente puede requerir Pro) |
| Código `worker/` Python | Producción | **Solo desarrollo / referencia / tests locales** |

## Alternativas descartadas

- **Docker local:** depende del PC.
- **Railway/Render:** segunda plataforma; el operador prefirió una sola (Vercel).
- **Cloudflare Workers:** reescritura completa, sin pandas (aceptable en TS de todos modos).

## Referencias

- `docs/ARCHITECTURE.md` — stack actualizado
- `docs/PRD.md` — user stories del operador actualizadas
- `vercel.json` — cron `*/5 * * * *`
