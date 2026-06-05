## Parent

#1

## Prioridad

**Fase 4 — POSPUESTO** (implementar cuando haya más usuarios o la URL sea pública)

> Auth **no es requerido en v1**. El único usuario es el operador/papá. Las alertas se configuran vía SQL seed o panel sin login hasta que este issue se implemente.

## What to build

Tracer bullet de autenticación end-to-end: un usuario invitado puede registrarse con código de un solo uso, iniciar sesión y cerrar sesión desde un panel React en español.

Incluye:
- Migración `invite_codes` (`code`, `used_at`, `used_by`) con RLS apropiada.
- Pantallas: registro (email + contraseña + código), login, logout.
- Flujo signup: validar código no usado → `signUp()` → marcar código con `used_at` y `used_by`. Errores en español si código inválido o ya usado.
- Seed SQL o script para insertar códigos de invitación de prueba.
- Test de integración del flujo invite (código válido crea cuenta; código usado rechaza).
- Activar RLS por usuario en `alerts` (reemplaza el modo single-user de v1).

Verificable: abrir frontend, registrarse con código seed, login, logout.

## Acceptance criteria

- [ ] Tabla `invite_codes` migrada con RLS
- [ ] Registro con código de un solo uso funciona end-to-end
- [ ] Login y logout funcionan
- [ ] Toda la UI de auth está en español
- [ ] Código usado o inválido muestra error claro en español
- [ ] Test de integración del flujo invite pasa
- [ ] Seed de códigos de invitación documentado
- [ ] RLS por usuario activo en `alerts`

## Blocked by

#9 (panel y worker en producción deben existir primero)
