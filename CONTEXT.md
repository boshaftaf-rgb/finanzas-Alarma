# Stock Alerts — lenguaje del dominio

Vocabulario acordado para código, documentación y UI. Usa estos términos de forma consistente.

## Language

**Alerta**:
Regla de monitoreo sobre un ticker que evalúa una condición técnica (cruce EMA, precio vs media, precio objetivo, RSI o Stochastic) y puede disparar un correo.
_Avoid_: regla, trigger genérico, notificación

**Preset**:
Configuración predefinida de alerta (cruce alcista 9/21, Golden Cross, RSI/Stoch sobreventa, etc.) con parámetros fijos.
_Avoid_: plantilla, template

**Alerta personalizada (custom)**:
Alerta donde el usuario define parámetros de cruce EMA, **precio vs media (SMA/EMA)**, **precio objetivo (nivel)**, RSI o Stochastic (no combinados en v1).
_Avoid_: alerta avanzada, regla custom

**Ticker**:
Símbolo bursátil de EE. UU. (ej. AAPL, MSFT). Máximo 15 únicos por usuario.
_Avoid_: símbolo, stock, acción (en contexto técnico)

**Vela (candle)**:
Barra OHLCV (15 min o diaria según `timeframe` de la alerta) usada para calcular indicadores y evaluar condiciones.
_Avoid_: barra, candlestick (en UI español)

**Candle-lock**:
Mecanismo que limita a un email por vela de 15 min por alerta, evitando spam mientras la condición persiste.
_Avoid_: throttle, debounce

**Cruce precio vs media (price_ma)**:
Evento en el que el cierre cruza por encima o por debajo de una SMA o EMA de período N entre vela anterior y actual.
_Avoid_: cruce de medias (cuando se habla solo de precio vs una línea)

**Precio objetivo (price_level)**:
Evento en el que el cierre cruza un nivel de precio fijo elegido por el usuario (`>=` o `<=`) entre vela anterior y actual.
_Avoid_: stop loss, take profit, alert absolute (en UI español)

**Timeframe**:
Intervalo de velas de la alerta: `15min` (presets y custom) o `1day` (solo custom). Determina qué significa el «período» de una media (ej. 12 velas diarias = 12 días).
_Avoid_: interval, granularity (en UI español)

**Cruce EMA**:
Evento en el que una media móvil exponencial cruza por encima o por debajo de otra en la vela más reciente.
_Avoid_: crossover genérico, señal

**Golden Cross / Death Cross**:
Cruce de EMA(50) sobre/bajo EMA(200); presets con nombres estándar del mercado.
_Avoid_: cruce largo, cruce mortal (traducción literal)

**RSI**:
Relative Strength Index; indicador de momentum en escala 0–100. Presets: sobreventa (<30), sobrecompra (>70).
_Avoid_: índice de fuerza relativa (en UI; ok en docs técnicos)

**Stochastic (Stoch)**:
Fast Stochastic %K; posición del cierre en el rango high–low de las últimas N velas (0–100). Presets: sobreventa Stoch (<20), sobrecompra Stoch (>80); default período 7. Custom: período, umbral y operador.
_Avoid_: estocástico lento, %D, cruce K/D (fuera de v1)

**Worker**:
Proceso Python en Docker que hace polling, descarga velas, evalúa alertas y envía correos.
_Avoid_: cron, job, servicio backend

**Polling**:
Ciclo de evaluación cada 5 minutos durante horario de mercado (lun–vie 9:30–16:00 EST).
_Avoid_: scraping, fetch loop

**Batch (Twelve Data)**:
Una sola petición API que solicita velas de todos los tickers activos en un ciclo.
_Avoid_: petición individual por ticker

**Horario de mercado**:
Ventana EST en la que el worker evalúa alertas (9:30–16:00, días hábiles EE. UU.).
_Avoid_: market hours (en UI español)

**Código de invitación**:
Token de un solo uso que habilita el registro de un nuevo usuario.
_Avoid_: invite token, código promo

**Operador del sistema**:
Persona que provisiona servicios, ejecuta el worker en Docker y gestiona códigos de invitación.
_Avoid_: admin, root (salvo contexto Supabase)

**Panel**:
Frontend React donde el usuario gestiona alertas (crear, editar, activar/desactivar).
_Avoid_: dashboard (preferir panel o listado)

**Activa / Inactiva**:
Estado de una alerta; inactiva no se evalúa ni envía correos, pero se conserva en BD.
_Avoid_: enabled/disabled (en UI español)

**Disparo**:
Registro en el panel de un correo ya enviado por una alerta; permanece visible (agrupado por ticker) hasta que el usuario lo borre. No es la alerta misma.
_Avoid_: notificación (como entidad), aviso de sistema, toast

**last_evaluated_at**:
Timestamp de la última vez que el worker evaluó una alerta.
_Avoid_: last_check, updated_at genérico

**Límite diario de emails**:
Máximo 10 correos por alerta por día; se reinicia automáticamente cada día.
_Avoid_: rate limit genérico
