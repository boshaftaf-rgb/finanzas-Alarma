# Stock Alerts (finanzas-Alarma) — guía para el agente

## Mandato del usuario — lógica del programa

La lógica del programa está **documentada y acordada** en `docs/PRD.md` y `docs/ARCHITECTURE.md`. El agente:

1. **No la modifica** salvo **petición explícita** del usuario.
2. **Avisa antes** si una tarea requiriese tocar lógica de negocio o flujos congelados; espera confirmación antes de editar.
3. No refactoriza, "mejora" ni reescribe por iniciativa propia.

Detalle de ámbitos y archivos congelados: sección *Lógica validada* más abajo.

## Documentación del proyecto (obligatorio)

Antes de implementar alertas, worker, auth o frontend, lee en este orden:

1. **`docs/PRD.md`** — requisitos, user stories y decisiones de producto.
2. **`docs/ARCHITECTURE.md`** — stack, esquema, RLS, worker y flujos técnicos.
3. **`docs/issues/00-orden-implementacion.md`** — orden de implementación y dependencias entre issues.

## Seguridad (obligatorio)

Antes de implementar o modificar auth, formularios, APIs, manejo de datos sensibles o integraciones externas, lee **`SECURITY.md` v1.0** en la raíz. Cubre OWASP Top 10, CWE, checklist de login/sesión y prácticas de código seguro.

## Código limpio (obligatorio)

Antes de generar, refactorizar o integrar lógica de negocio, lee **`CLEAN-CODE.md` v1.0** en la raíz. Define modularidad, flujo predecible, nomenclatura, configuración desacoplada y checklist de revisión humana.

## Diseño (obligatorio)

Antes de generar o modificar UI, lee **`DESIGN.md` v1.0** en la raíz. Define look & feel OLED, acento esmeralda, tipografía Fira y componentes del panel Stock Alerts.

## Lenguaje del dominio

Antes de nombrar variables, tablas o componentes UI, consulta **`CONTEXT.md`** para usar el vocabulario acordado (alerta, preset, candle-lock, ticker, etc.).

## Complemento opcional

- **`CLEAN-CODE.md`** — estándar de arquitectura y legibilidad; aplicar en todo código nuevo o refactorizado.
- **`SECURITY.md`** — estándar permanente del repo; los agentes deben aplicarlo en todo código nuevo.
- **`sec-expert`** (skill global `sec-expert`) — agente **Sec Expert**: auditoría profunda contra OWASP/CWE, CVSS, informe estructurado y parches. Invócalo para revisiones puntuales o antes de releases críticos.
- **`impeccable`** / **`ui-ux-pro-max`** (skills globales) — para diseño UI/UX del panel React cuando aplique.

## Stack

| Capa | Tecnología |
|------|------------|
| Base de datos + Auth | Supabase (PostgreSQL + RLS) |
| Frontend | React + Vite → Vercel |
| Worker | Python (`pandas`, `pandas-ta`) en Docker local |
| Datos de mercado | Twelve Data (velas 15 min, batch) |
| Email | Gmail SMTP |

No hay backend HTTP en v1: el frontend habla directo con Supabase; el worker usa `service_role` aislado en Docker.

## Lógica validada — no tocar sin pedido explícito

Varios flujos **ya documentados o implementados** no deben refactorizarse por iniciativa propia (sobre todo si un agente sugiere "limpieza" o "simplificación").

**Ámbitos congelados salvo bug reportado o tarea explícita del usuario:**

| Ámbito | Piezas |
| --- | --- |
| Límites de producto | 15 tickers únicos, 5 alertas/ticker, 10 emails/alerta/día, candle-lock |
| Horario worker | Lun–vie 9:30–16:00 EST; polling cada 5 min |
| Twelve Data | Una petición batch por ciclo (free tier) |
| Secretos | `service_role` solo en Docker; nunca en `VITE_*` ni Vercel |
| Esquema acordado | Tablas, RLS y triggers según `docs/ARCHITECTURE.md` |

**Reglas:**

1. **No cambiar** límites de negocio ni reglas de evaluación EMA/RSI sin petición explícita.
2. **No sustituir** credenciales de plantilla en el repo por valores reales; las reales viven solo en `.env` (gitignored).
3. Nuevas features o bugs: **cambio mínimo** en el módulo afectado; no arrastrar refactors colaterales.
4. Si hace falta tocar algo de la tabla anterior, el usuario debe pedirlo **de forma explícita** o abrir un issue acotado.
5. Si el agente detecta que una tarea colateral implicaría tocar lógica congelada, **debe avisar al usuario antes** de hacer cualquier cambio.

Ver también la sección *Código existente que funciona* en `CLEAN-CODE.md`.

## Tareas humanas

Algunas tareas requieren acceso a cuentas reales (Supabase, Twelve Data, Gmail, Vercel). El agente no debe avanzar ciertas piezas hasta que el operador complete las tareas en **`TAREAS-HUMANO.md`**.
