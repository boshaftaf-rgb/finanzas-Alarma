## Parent

#1

## Prioridad

**Fase 1 — Implementar ahora** (orden #1)

## What to build

Provisionar y documentar los servicios externos necesarios para Stock Alerts antes de escribir código de producto.

Acciones del operador:
- Crear proyecto en **Supabase** (solo base de datos por ahora; Auth se pospone — ver #3).
- Obtener `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Crear cuenta **Twelve Data** y obtener API key (plan free).
- Configurar **Gmail SMTP**: cuenta con 2FA, App Password y remitente (`SMTP_USER`).

**Pospuesto para más adelante:**
- Cuenta **Vercel** (Fase 3, cuando exista panel — ver #9).

Entregable en repo: `.env.example` documentando variables para worker y frontend futuro, sin valores secretos.

## Acceptance criteria

- [ ] Proyecto Supabase creado y accesible
- [ ] Claves Supabase (anon + service_role) obtenidas y guardadas fuera del repo
- [ ] API key Twelve Data obtenida
- [ ] App Password de Gmail creada y guardada fuera del repo
- [ ] `.env.example` commiteado con todas las variables nombradas y comentadas en español
- [ ] README o sección en docs con pasos de provisioning para el operador

## Blocked by

None - can start immediately
