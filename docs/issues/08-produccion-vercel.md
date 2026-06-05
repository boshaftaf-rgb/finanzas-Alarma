## Parent

#1

## Prioridad

**Fase 2e** (Docker) — orden #6 — implementar **ahora** tras #8.

**Fase 3c** (Vercel) — orden #9 — implementar **después** del panel (#4 Fase 3a, #5).

## What to build

Poner Stock Alerts en modo operación.

### Fase 2e — Worker en producción (ahora)

- Loop del worker cada 5 minutos dentro del contenedor (sin Task Scheduler de Windows).
- `docker compose up` levanta el worker en modo producción.
- Logs del worker en español durante operación normal.
- README operador: aplicar migraciones, seed alertas, variables worker, `docker compose up`.

Verificable: worker corre en Docker durante horario de mercado; papá recibe emails.

### Fase 3c — Deploy Vercel (después)

- Config Vercel: root `frontend/`, env `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Frontend accesible por URL sin login.

Verificable: panel accesible en Vercel; crear alerta → worker evalúa → email recibido.

## Acceptance criteria

### Fase 2e (requerida ahora)

- [ ] Worker corre en loop cada 5 min en Docker
- [ ] `docker compose up` inicia el worker sin pasos manuales extra
- [ ] Logs operativos del worker en español
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo en env del contenedor Docker
- [ ] README documenta setup del worker para el operador
- [ ] Flujo verificado: alerta en seed SQL → worker evalúa → papá recibe email

### Fase 3c (después del panel)

- [ ] Frontend desplegado en Vercel y accesible por URL
- [ ] Flujo end-to-end: crear alerta en Vercel → worker evalúa → email recibido

## Blocked by

- **Fase 2e (Docker):** #8
- **Fase 3c (Vercel):** #5
