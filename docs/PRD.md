# PRD: Stock Alerts (finanzas-Alarma)

## Problem Statement

Los inversores que siguen el mercado bursátil de EE. UU. necesitan vigilar decenas de condiciones técnicas (cruces de medias, RSI en zonas extremas) en múltiples acciones, pero no pueden estar pegados a una pantalla durante todo el horario de mercado (9:30–16:00 EST). Revisar gráficos manualmente es lento, propenso a olvidos, y las alertas genéricas de las plataformas de trading no permiten reglas personalizadas con parámetros concretos.

El usuario quiere una plataforma donde pueda registrarse de forma controlada, elegir hasta 15 acciones, configurar alertas técnicas predefinidas o personalizadas, y recibir notificaciones por correo automáticamente cuando el mercado cumpla esas condiciones — sin depender de un backend propio ni de infraestructura cloud costosa para el motor de análisis.

## Solution

**Stock Alerts** es una plataforma web de análisis técnico automatizado que:

1. Permite a usuarios invitados registrarse con email y contraseña usando un código de un solo uso.
2. Ofrece un panel web (español) para crear, editar, activar y desactivar alertas sobre tickers de EE. UU.
3. Ejecuta un **worker serverless en Vercel** (Cron cada 5 min) que, durante el horario de mercado, descarga datos de mercado en **una sola petición batch** (Twelve Data), calcula indicadores (EMA, RSI, Stochastic) sobre velas de 15 minutos o diarias, y envía correos vía Gmail SMTP cuando las condiciones se cumplen.
4. Protege contra spam de correos mediante **candle-lock** (máximo un email por vela de 15 min por alerta) y un tope de 10 emails por alerta por día.
5. Almacena configuración y estado en Supabase (PostgreSQL + Auth + RLS), con el frontend hablando directamente con Supabase y el worker usando `service_role` de forma aislada.

## User Stories

1. As a **usuario invitado**, I want to **registrarme con email, contraseña y código de invitación de un solo uso**, so that **solo personas autorizadas accedan al panel**.
2. As a **usuario registrado**, I want to **iniciar sesión con email y contraseña**, so that **acceda a mis alertas de forma segura**.
3. As a **usuario registrado**, I want to **cerrar sesión**, so that **nadie más use mi cuenta en un dispositivo compartido**.
4. As a **usuario registrado**, I want to **ver un listado de todas mis alertas activas e inactivas**, so that **tenga una vista centralizada de lo que estoy monitoreando**.
4b. As a **usuario registrado**, I want to **reordenar por arrastre los grupos de ticker en el listado de alertas** y que ese orden se guarde, so that **vea primero las acciones que más me importan**.
5. As a **usuario registrado**, I want to **crear una alerta seleccionando un ticker de EE. UU.**, so that **monitoree una acción concreta**.
6. As a **usuario registrado**, I want to **elegir un preset de alerta** (cruce alcista 9/21, cruce bajista 9/21, Golden Cross, Death Cross, RSI sobreventa/sobrecompra, Stoch sobreventa/sobrecompra), so that **configure reglas comunes sin entender parámetros técnicos**.
7. As a **usuario registrado**, I want to **crear una alerta personalizada de tipo EMA** con períodos rápido/lento y dirección de cruce configurables, so that **adapte cruces de medias a mi estrategia**.
8. As a **usuario registrado**, I want to **crear una alerta personalizada de tipo RSI** con período, umbral y operador (< o >) configurables, so that **defina zonas de sobreventa/sobrecompra distintas a los presets**.
8b. As a **usuario registrado**, I want to **crear una alerta personalizada de tipo Stochastic** con período, umbral y operador (< o >) configurables, so that **vigile %K en zonas de sobreventa/sobrecompra**.
9. As a **usuario registrado**, I want to **no poder combinar EMA, RSI y Stochastic en una sola alerta custom**, so that **el sistema permanezca simple y predecible en v1**.
10. As a **usuario registrado**, I want to **activar y desactivar una alerta sin borrarla**, so that **pause temporalmente el monitoreo de un ticker**.
11. As a **usuario registrado**, I want to **eliminar una alerta**, so that **deje de recibir notificaciones y libere cupo**.
12. As a **usuario registrado**, I want to **recibir un mensaje claro si intento añadir un ticker número 16**, so that **entienda el límite de 15 símbolos únicos**.
13. As a **usuario registrado**, I want to **recibir un mensaje claro si intento crear más de 5 alertas en el mismo ticker**, so that **no abuse del sistema ni de mi cuota de correos**.
14. As a **usuario registrado**, I want to **poder tener varias alertas en el mismo ticker con reglas distintas** (hasta 5), so that **monitoree por ejemplo cruce EMA y RSI sobreventa en AAPL simultáneamente**.
15. As a **usuario registrado**, I want to **ver toda la interfaz en español**, so that **use la plataforma en mi idioma sin fricción**.
16. As a **usuario registrado**, I want to **recibir un correo en español cuando se dispare una alerta**, so that **entienda qué condición se cumplió sin abrir el panel**.
17. As a **usuario registrado**, I want to **recibir como máximo un correo por vela de 15 minutos por alerta**, so that **no me bombardeen con avisos duplicados mientras la condición sigue vigente**.
18. As a **usuario registrado**, I want to **recibir como máximo 10 correos por alerta por día**, so that **el sistema respete límites razonables de envío**.
19. As a **usuario registrado**, I want to **que mis alertas solo sean visibles para mí**, so that **otros usuarios no accedan a mi configuración**.
20. As a **operador del sistema**, I want to **generar códigos de invitación de un solo uso en la base de datos**, so that **invite conocidos de forma controlada**.
21. As a **operador del sistema**, I want to **desplegar el worker en Vercel Cron** (función serverless), so that **las alertas se evalúen 24/7 sin depender de mi PC**.
22. As a **operador del sistema**, I want to **que el worker solo evalúe alertas de lunes a viernes entre 9:30 y 16:00 EST**, so that **no consuma API ni envíe correos fuera del horario de mercado**.
23. As a **operador del sistema**, I want to **que el worker haga una sola petición batch a Twelve Data por ciclo de polling**, so that **permanezca dentro del free tier (78 req/día vs 800 disponibles)**.
24. As a **operador del sistema**, I want to **que la clave service_role de Supabase solo exista en variables server-side de Vercel** (cron), so that **no se filtre al bundle del frontend ni al repositorio**.
25. As a **operador del sistema**, I want to **desplegar el frontend en Vercel**, so that **el panel esté siempre accesible sin levantar un servidor local**.
26. As a **operador del sistema**, I want to **aplicar migraciones versionadas de esquema Supabase**, so that **RLS, triggers y tablas sean reproducibles**.
27. As a **usuario registrado**, I want to **que las alertas de cruce EMA se disparen cuando ocurre un cruce en la vela de 15 min más reciente**, so that **reciba señales de momentum o reversión oportunas**.
28. As a **usuario registrado**, I want to **que las alertas RSI se disparen cuando el RSI cumple el umbral en la vela actual**, so that **detecte condiciones de sobreventa o sobrecompra**.
28b. As a **usuario registrado**, I want to **que las alertas Stochastic se disparen cuando el %K cumple el umbral en la vela actual**, so that **detecte extremos del rango high–low reciente**.
29. As a **usuario registrado**, I want to **que el correo incluya ticker, tipo de alerta, timeframe (15m) y timestamp de la vela**, so that **tenga contexto suficiente para actuar**.
30. As a **usuario registrado**, I want to **acceder al panel desde cualquier navegador sin instalar software**, so that **gestione alertas desde cualquier dispositivo**.
31. As a **operador del sistema**, I want to **ver logs del worker en español**, so that **depure problemas sin traducir mensajes**.
32. As a **operador del sistema**, I want to **que el worker actualice last_evaluated_at en cada ciclo**, so that **sepa cuándo se evaluó por última vez cada alerta**.
33. As a **operador del sistema**, I want to **que el contador diario de emails se reinicie automáticamente cada día**, so that **las alertas vuelvan a poder enviar correos al día siguiente**.
34. As a **usuario registrado**, I want to **validación de ticker en el formulario** (formato básico, símbolo no vacío), so that **no cree alertas inválidas**.
35. As a **usuario registrado**, I want to **ver el estado activo/inactivo de cada alerta en el listado**, so that **identifique de un vistazo qué reglas están en marcha**.
36. As a **usuario registrado**, I want to **editar parámetros de una alerta existente**, so that **ajuste estrategia sin recrear desde cero**.
37. As a **operador del sistema**, I want to **un archivo .env.example documentando todas las variables necesarias**, so that **configure frontend, worker y Supabase sin adivinar**.
38. As a **operador del sistema**, I want to **que Vercel Cron invoque el worker cada 5 minutos**, so that **el polling funcione sin Docker ni Task Scheduler local**.
39. As a **usuario registrado**, I want to **ver en el panel cada disparo (correo enviado) agrupado por ticker hasta que lo borre**, so that **tenga un historial visible sin depender solo del email**.
40. As a **usuario registrado**, I want to **abrir los disparos desde un icono de campana y ver qué alertas quedaron marcadas como disparadas**, so that **entienda qué reglas ya avisaron**.

## Implementation Decisions

### Arquitectura general

- **Monorepo** con: frontend (React + Vite), `api/` + `lib/` (worker TypeScript en Vercel), `worker/` Python (solo dev local), `supabase/migrations`.
- **Frontend** en Vercel con `@supabase/supabase-js` (`anon`, RLS).
- **Worker** en **Vercel Cron** → `api/cron/evaluate` con `service_role` y secretos solo server-side.
- **Sin backend HTTP dedicado** (no FastAPI): panel → Supabase; cron → Supabase + Twelve Data + SMTP.
- **Frontend desplegado en Vercel** (`frontend/`).
- **Idioma:** español en UI, emails y logs del worker.

### Módulos principales

| Módulo | Responsabilidad |
|--------|-----------------|
| **Frontend — Auth** | Login, signup con código de invitación, sesión Supabase |
| **Frontend — Alertas CRUD** | Crear, listar, editar, activar/desactivar, eliminar alertas |
| **Supabase — Migraciones** | Tablas, RLS, triggers de límites, tabla invite_codes |
| **Worker — Scheduler** | Gate de horario (lun–vie 9:30–16:00 EST); sin feriados NYSE en v1 |
| **Worker — DataFetcher** | Una petición batch a Twelve Data por ciclo; símbolos deduplicados separados por comas; intervalo 15min |
| **Worker — IndicatorEngine** | Cálculo EMA, RSI y Stochastic %K sobre OHLCV recibido |
| **Worker — AlertEvaluator** | Evalúa condiciones, aplica candle-lock y tope diario, produce decisiones de disparo |
| **Worker — EmailSender** | Envío vía Gmail SMTP con plantilla en español |
| **Worker — AlertStore** | Lectura/escritura de alertas vía Supabase service_role |

### Esquema de datos

**Tabla `alerts`:**

| Campo | Tipo |
|-------|------|
| id | UUID PK |
| user_id | UUID FK |
| ticker | TEXT |
| preset_or_custom | TEXT |
| params | JSONB |
| active | BOOLEAN |
| emails_sent_today | INTEGER (default 0) |
| email_count_date | DATE |
| last_triggered_candle | TIMESTAMPTZ (nullable hasta primer disparo) |
| last_evaluated_at | TIMESTAMPTZ |

**Tabla `user_ticker_order`:**

| Campo | Tipo |
|-------|------|
| user_id | UUID (PK compuesta) |
| ticker | TEXT (PK compuesta) |
| sort_order | INTEGER |

Orden de grupos de ticker en el panel; no lo usa el worker.

**Tabla `invite_codes`:**

| Campo | Tipo |
|-------|------|
| code | TEXT PK |
| used_at | TIMESTAMPTZ |
| used_by | UUID FK |

**Triggers PostgreSQL:**

- Máx. 15 tickers únicos activos por `user_id`.
- Máx. 5 alertas activas por (`user_id`, `ticker`).

**RLS:**

- Políticas en `alerts` e `invite_codes` (lectura/escritura restringida por `auth.uid()` donde aplique).
- Worker bypassa RLS con `service_role`.

### Presets de alerta

| ID | Lógica (velas 15m) |
|----|---------------------|
| ema_cross_bull | EMA(9) cruza arriba EMA(21) |
| ema_cross_bear | EMA(9) cruza abajo EMA(21) |
| golden_cross | EMA(50) cruza arriba EMA(200) |
| death_cross | EMA(50) cruza abajo EMA(200) |
| rsi_oversold | RSI(period) < threshold (defaults 14 / 30; editables) |
| rsi_overbought | RSI(period) > threshold (defaults 14 / 70; editables) |
| stoch_oversold | Stoch(period) < threshold (defaults 7 / 20; editables; timeframe **1day**) |
| stoch_overbought | Stoch(period) > threshold (defaults 7 / 80; editables; timeframe **1day**) |
| custom | Sub-form EMA, precio vs media (SMA/EMA), precio objetivo, RSI o Stochastic; timeframe 15m o 1D |

Presets RSI/Stoch persisten `params`: `{ period, threshold }`. Operador fijo: `<` (sobreventa) o `>` (sobrecompra). Presets Stoch se guardan con `timeframe=1day` (7 = 7 días).

### Regla de disparo (AlertEvaluator)

```
disparar SI:
  condición_cumplida
  AND timestamp_vela_actual > last_triggered_candle (o last_triggered_candle IS NULL)
  AND emails_sent_today < 10 (tras reset diario si email_count_date < CURRENT_DATE)
```

Tras disparo: actualizar `last_triggered_candle`, incrementar `emails_sent_today`, setear `email_count_date = CURRENT_DATE`.

### Batching Twelve Data

- Por ciclo: leer alertas activas → agrupar por `timeframe` → **1 request por intervalo** (`15min`, `1day`) con símbolos deduplicados.
- Consumo: ~78–156 req/día (dentro de 800 free).
- Sin caché de velas en v1.

### Seguridad de claves

| Cliente | Clave | RLS |
|---------|-------|-----|
| Frontend (Vercel) | anon | Activo |
| Worker (Vercel Cron) | service_role | Bypass |

`SUPABASE_SERVICE_ROLE_KEY`, `TWELVE_DATA_API_KEY`, `SMTP_APP_PASSWORD` solo en env del worker. `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel.

### Contratos entre módulos

- **DataFetcher → IndicatorEngine:** `dict[ticker, DataFrame]` con columnas OHLCV y timestamps de vela.
- **IndicatorEngine → AlertEvaluator:** indicadores calculados por ticker + timestamp de vela más reciente.
- **AlertEvaluator → EmailSender:** `{user_email, ticker, preset_name, vela_timestamp, params_resumen}`.
- **Frontend → Supabase:** operaciones CRUD estándar; signup incluye validación y consumo de invite_code.

### Signup con código de un solo uso

1. Usuario ingresa email, contraseña, código.
2. Frontend verifica que `invite_codes.code` existe y `used_at IS NULL`.
3. Si válido → `signUp()` → marca código con `used_at` y `used_by`.
4. Si inválido o usado → error en español, no se crea cuenta.

## Testing Decisions

### Principio

Solo probar **comportamiento observable externo**, no detalles de implementación internos. Preferir costuras existentes de alto nivel; donde no existan (proyecto greenfield), proponer las más altas posibles.

### Costuras de prueba propuestas

| # | Costura | Qué se prueba | Tipo |
|---|---------|---------------|------|
| 1 | **AlertEvaluator** (módulo puro) | Dada una alerta + serie OHLCV + estado (`last_triggered_candle`, contadores), devuelve disparar/no disparar correctamente. Cubre: condición EMA cross, RSI/Stoch threshold, candle-lock, reset diario DATE, tope 10 emails. | Unit |
| 2 | **IndicatorEngine** (módulo puro) | Dado OHLCV conocido, produce EMA/RSI/Stochastic consistentes con valores de referencia (dataset fixture pequeño). | Unit |
| 3 | **MarketScheduler** (módulo puro Python) | Dado un instante, responde si el mercado está abierto (lun–vie 9:30–16:00 EST). Casos: sábado, viernes 16:01, lunes 9:29, miércoles 12:00. | Unit |
| 4 | **DataFetcher batching** (con mock HTTP) | Dadas N alertas con tickers solapados, realiza exactamente 1 request con todos los símbolos únicos. | Integration |
| 5 | **Supabase RLS + triggers** (cliente de test) | Usuario A no lee alertas de B; inserción ticker #16 falla; inserción alerta #6 en mismo ticker falla. | Integration |
| 6 | **Signup invite flow** (cliente de test) | Código válido → cuenta creada + código marcado usado; código ya usado → rechazo. | Integration |
| 7 | **Worker cycle end-to-end** (todo mock: Supabase, Twelve Data, SMTP) | Un ciclo completo: leer alertas → batch → evaluar → enviar 0 o 1 email → persistir estado. | Integration |

### Prior art

No hay tests previos en el repositorio (greenfield). Los patrones anteriores se establecerán como convención inicial.

### Qué no testear en v1

- Implementación interna de pandas-ta (librería de terceros).
- UI pixel-perfect o estilos CSS.
- Conexión real a Twelve Data o Gmail SMTP en CI (usar mocks/fixtures).
- Feriados NYSE (fuera de alcance).

## Out of Scope

- Backend HTTP (FastAPI, Flask, Edge Functions) en v1.
- Feriados y early close del NYSE.
- Combinación de condiciones EMA + RSI + Stochastic en una sola alerta.
- Caché de velas (innecesaria con batching).
- Internacionalización / inglés.
- Registro público sin código de invitación.
- Facturación, planes de pago, panel de administración.
- Alertas por SMS, push o webhook.
- Acciones fuera de EE. UU. o criptomonedas.
- Timeframes distintos a **15 min** y **diario** (1h, 4h, etc.).
- App móvil nativa.
- OAuth (Google, etc.).

## Further Notes

- El worker corre en **Vercel Cron**; si el deploy falla o el cron se deshabilita, no hay evaluación ni correos hasta restaurar el proyecto.
- Feriados NYSE no se consideran en v1; el worker podría ejecutar ciclos vacíos en días feriados que caen en día laborable.
- Golden Cross y Death Cross en velas de 15m son ruidosos; se incluyen como presets por decisión de producto, no por robustez estadística.
- Gmail SMTP (~500 emails/día en cuentas personales) es el límite global práctico; con candle-lock + 10/alerta/día + máx. 5 alertas × 15 tickers el peor caso teórico debe mantenerse bajo control.
- Documento de arquitectura de referencia: `docs/ARCHITECTURE.md`.
