## Parent

#1

## Prioridad

**Fase 2a** (solo migración) → orden #2 — hacer **antes del worker**, solo la migración y seed SQL.

**Fase 3a** (panel UI) → orden #7 — hacer **después del worker en Docker**, sin login.

## What to build

Tracer bullet de alertas con presets. En v1 **sin autenticación** (un solo usuario — papá).

### Fase 2a — Migración (ahora)

- Scaffold monorepo: `supabase/migrations/` (y `frontend/` vacío o mínimo).
- Migración tabla `alerts` con todos los campos del PRD (`preset_or_custom`, `params` JSONB, `active`, `emails_sent_today`, `email_count_date` DATE, `last_triggered_candle`, `last_evaluated_at`).
- Triggers PostgreSQL: máx. 15 tickers únicos activos; máx. 5 alertas activas por ticker.
- **Sin RLS por usuario en v1** — acceso vía `service_role` (worker) y seed SQL manual.
- Seed SQL de ejemplo con alertas para papá.
- Tests de triggers (límites 15 tickers / 5 por ticker).

Verificable: insertar alertas vía SQL seed; worker las lee en #6.

### Fase 3a — Panel sin login (después)

- Panel React (español): listar, crear con 6 presets, activar/desactivar, eliminar.
- Sin pantalla de login; conexión directa a Supabase.
- Validación básica de ticker; mensajes de error en español.

Verificable: crear alerta preset desde el panel sin autenticarse.

## Acceptance criteria

### Fase 2a (requerida ahora)

- [ ] Tabla `alerts` migrada con triggers de límites
- [ ] Seed SQL de alertas de ejemplo documentado
- [ ] Tests de triggers pasan

### Fase 3a (después del worker)

- [ ] CRUD de alertas con 6 presets funciona en UI español
- [ ] Listado muestra estado activo/inactivo
- [ ] Activar/desactivar y eliminar funcionan
- [ ] Límite 15 tickers y 5 por ticker enforced (UI + DB)
- [ ] Validación básica de ticker en formulario
- [ ] Panel accesible sin login

## Blocked by

#2
