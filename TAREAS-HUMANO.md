# Tareas humanas — Stock Alerts (finanzas-Alarma)

Guía operativa para el **operador humano** del sistema. Los agentes y desarrolladores no deben avanzar ciertas piezas hasta que completes estas tareas y dejes constancia (comentario en issue o confirmación explícita).

---

## Resumen rápido

| Prioridad | Qué hacer | Issue / doc | Desbloquea |
| --- | --- | --- | --- |
| **Ahora** | Aprovisionar Supabase, Twelve Data y Gmail SMTP | [#2](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/2) · [`docs/provisioning.md`](docs/provisioning.md) | Migraciones, worker, emails |
| **Antes de prod** | Deploy frontend en Vercel | [#9](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/9) | Panel accesible 24/7 |
| **Más adelante** | Auth + códigos de invitación + RLS por usuario | [#3](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/3) | Multi-usuario seguro |

Orden de implementación completo: [`docs/issues/00-orden-implementacion.md`](docs/issues/00-orden-implementacion.md).

---

## 1. Servicios externos — aprovisionamiento

**Issue:** [#2 — Servicios externos](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/2)

**Runbook:** [`docs/provisioning.md`](docs/provisioning.md)

### Por qué lo haces tú

Las API keys, App Passwords de Gmail y `service_role` de Supabase requieren acceso a cuentas reales y criterio humano sobre dónde guardarlas.

### Checklist

- [ ] Crear proyecto Supabase → copiar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Registrarse en Twelve Data (plan free) → `TWELVE_DATA_API_KEY`
- [ ] Gmail con 2FA → App Password → `SMTP_APP_PASSWORD`
- [ ] Configurar `SMTP_USER`, `ALERT_RECIPIENT_EMAIL` y resto de variables
- [ ] `cp .env.example .env` y rellenar con valores reales
- [ ] Verificar que `.env` **no** se commitea (está en `.gitignore`)
- [ ] Comentar en #2: *"Servicios provisionados. Listo para migraciones/worker."*

### Lo que NO debes hacer

- No commitear `.env`, `service_role` key ni App Password al repositorio
- No poner `SUPABASE_SERVICE_ROLE_KEY` en variables `VITE_*` ni en Vercel
- No compartir secretos en issues públicos, Slack abierto ni commits

---

## 2. Supabase — migraciones y RLS (cuando aplique auth)

**Docs:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

### Por qué lo revisas tú

Las políticas RLS son la barrera de aislamiento entre usuarios. Un agente puede escribir el SQL en el repo, pero **tú** debes revisarlo antes de confiar en producción.

### Checklist (fase auth — issue #3)

- [ ] Activar **email/password** en Supabase Authentication
- [ ] **Desactivar** registro público (solo con código de invitación)
- [ ] Revisar RLS en `alerts`: `user_id = auth.uid()`
- [ ] Revisar RLS en `alert_firings`: `user_id = auth.uid()` (SELECT/DELETE)
- [ ] Revisar políticas en `invite_codes`
- [ ] Crear códigos de invitación de prueba en BD
- [ ] En Supabase → Authentication → URL Configuration: dominio Vercel en Site URL y redirect allow list

### Migración actual (disparos UI)

- [ ] Aplicar en el proyecto Supabase la migración `supabase/migrations/20260713180000_create_alert_firings.sql` (SQL editor o CLI)
- [ ] Si la campana/Disparos no muestra filas (RLS activo): aplicar también `supabase/migrations/20260713190000_repair_alert_firings_anon_access.sql`
- [ ] Verificar grants: anon SELECT/DELETE en `alert_firings`; INSERT solo vía worker; RLS **desactivado** en v1 (igual que `alerts`)

### Migración actual (orden de tickers en el panel)

- [ ] Aplicar en el proyecto Supabase la migración `supabase/migrations/20260714120000_create_user_ticker_order.sql` (SQL editor o CLI)
- [ ] Si al reordenar tickers falla el guardado (RLS / “violates row-level security”): aplicar también `supabase/migrations/20260715180000_repair_user_ticker_order_anon_access.sql`
- [ ] Verificar grants: anon SELECT/INSERT/UPDATE/DELETE en `user_ticker_order`; RLS **desactivado** en v1 (igual que `alerts`)

### Migración actual (RSI presets → diario)

- [ ] Aplicar en el proyecto Supabase la migración `supabase/migrations/20260715190000_rsi_presets_daily_timeframe.sql` (SQL editor o CLI)
- [ ] Verificar que alertas `rsi_oversold` / `rsi_overbought` existentes tienen `timeframe = '1day'`

### Migración actual (Golden / Death Cross → diario)

- [ ] Aplicar en el proyecto Supabase la migración `supabase/migrations/20260715191000_long_ema_presets_daily_timeframe.sql` (SQL editor o CLI)
- [ ] Verificar que alertas `golden_cross` / `death_cross` existentes tienen `timeframe = '1day'`

### Migración actual (todas las alertas → diario)

- [ ] Aplicar en el proyecto Supabase la migración `supabase/migrations/20260715200000_all_alerts_daily_timeframe.sql` (SQL editor o CLI)
- [ ] Verificar: `SELECT DISTINCT timeframe FROM public.alerts;` → solo `1day`

### Entregables

| Entregable | Dónde va |
| --- | --- |
| URL + anon key | `.env` local + Vercel (`VITE_*`) |
| service_role key | Solo `.env` del worker Docker |
| Sign-off RLS | Comentario en issue #3 |

---

## 3. Worker — deploy en Vercel Cron

**Issues:** [#7](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/7), [#9](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/9)

**Runbook:** [`docs/vercel-deploy.md`](docs/vercel-deploy.md)

### Checklist

- [ ] Proyecto conectado a Vercel (mismo repo: `frontend/` + `api/`)
- [ ] Variables server-side: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, SMTP, Twelve Data
- [ ] `WORKER_USE_FIXTURES=false` en producción
- [ ] `vercel.json` desplegado (sin Vercel Cron)
- [ ] Secrets GitHub: `VERCEL_APP_URL`, `CRON_SECRET`
- [ ] Workflow **Evaluar alertas** corre en Actions (o prueba manual con curl)
- [ ] Verificar logs en Vercel → Functions durante horario de mercado
- [ ] Confirmar que papá recibe email de prueba cuando se dispara una alerta

### Lo que NO debes hacer

- No poner `SUPABASE_SERVICE_ROLE_KEY` en variables `VITE_*`
- No commitear `CRON_SECRET` al repositorio

---

## 4. Vercel — deploy del frontend (Fase 3)

**Issue:** [#9](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/9)

### Por qué lo haces tú

DNS, secrets de Vercel y URLs en Supabase Auth requieren acceso a cuentas reales.

### Checklist

- [ ] Conectar repo a Vercel
- [ ] Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (nunca `service_role`)
- [ ] Verificar deploy exitoso
- [ ] Actualizar Site URL y redirect allow list en Supabase Auth
- [ ] Smoke test: abrir panel, crear/editar alerta

---

## Tareas recurrentes

### Generar códigos de invitación

Cuando entre un usuario nuevo (post-auth):

1. Insertar código de un solo uso en tabla `invite_codes` (SQL o script)
2. Comunicar el código por canal seguro
3. El usuario se registra con email + contraseña + código

### Rotación de secretos

Si un secreto aparece en código, commits o logs:

1. Rotar inmediatamente en el proveedor (Supabase, Twelve Data, Gmail)
2. Actualizar `.env` local y secrets de Vercel/Docker
3. Ver `SECURITY.md` → Gestión de secretos

### Revisión de RLS en cada migración nueva

Aunque el agente implemente el schema inicial, **revisa** cualquier migración SQL nueva que toque políticas antes de merge a main.

---

## Orden sugerido

```
Fase 1 — ahora
├── #2 Provisioning (Supabase + Twelve Data + Gmail)
├── Migraciones + seed SQL
├── Worker TS en Vercel (lib/ + api/cron)
├── Twelve Data batch
└── Gmail SMTP + candle-lock

Hito: papá recibe alertas por email (cron Vercel)

Fase 2 — después
├── Panel presets (sin login o con auth)
├── Alertas custom EMA/RSI
└── Deploy Vercel

Fase 3 — más adelante
└── #3 Auth + invitaciones + RLS multi-usuario
```

---

## Referencias

| Documento | Para qué |
| --- | --- |
| `SECURITY.md` | Auth, secretos, RLS, OWASP |
| `AGENTS.md` | Reglas para agentes de IA |
| `docs/PRD.md` | Requisitos y user stories |
| `docs/ARCHITECTURE.md` | Esquema, worker, límites |
| `docs/provisioning.md` | Paso a paso de servicios externos |
