## Parent

#1

## Prioridad

**Fase 3b** — orden #8 (después del panel presets sin login, #4 Fase 3a)

## What to build

Extender el panel de alertas con modo **personalizado**: crear y editar alertas custom de tipo EMA o RSI (no combinadas en una sola alerta).

Incluye:
- Formulario `custom` con sub-form EMA: períodos rápido/lento configurables + dirección de cruce (↑/↓).
- Sub-form RSI: período, umbral y operador (`<` o `>`) configurables.
- Edición de parámetros de alertas existentes (presets y custom).
- Validación UI: no permitir combinar EMA y RSI en una sola alerta custom.
- `params` JSONB almacena configuración custom de forma consistente.

> Sin auth en v1 — mismo panel sin login que #4 Fase 3a.

Verificable: crear alerta custom EMA 12/26, crear alerta custom RSI(10) < 25, editar una alerta existente.

## Acceptance criteria

- [ ] Crear alerta custom tipo EMA con períodos y dirección configurables
- [ ] Crear alerta custom tipo RSI con período, umbral y operador configurables
- [ ] No se puede combinar EMA y RSI en una sola alerta custom
- [ ] Editar parámetros de alerta existente (preset y custom)
- [ ] UI y mensajes en español
- [ ] `params` JSONB persiste correctamente en Supabase

## Blocked by

#4 (Fase 3a — panel presets sin login)
