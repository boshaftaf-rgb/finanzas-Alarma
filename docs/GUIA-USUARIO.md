Stock Alerts — Guía para perfil financiero

Monitor técnico automatizado: acciones EE. UU., velas 15m, señales EMA (cruces) o RSI (umbrales), aviso por correo. No ejecuta órdenes ni es asesoría. Datos: Twelve Data (posible ligero retraso en plan gratuito).

---

Ficha operativa

| Parámetro | Valor |
|-----------|-------|
| Universo | Acciones EE. UU. (ej. AAPL, BRK.B) |
| Timeframe | 15 min (presets) o **diario** (alertas personalizadas) |
| Precio usado | Close de cada vela |
| Evaluación | Cada 5 min, lun–vie 9:30–16:00 ET (America/New_York) |
| Pre/post market | No |
| Festivos NYSE | No excluidos (worker corre; sin datos si mercado cerrado) |
| Indicadores | EMA (cruce), RSI Wilder (umbral) |
| Salida | Correo en español |

---

Definición de señales

Cómo evalúa el worker

1. Descarga velas de 15m con su precio de cierre.
2. Calcula EMA y/o RSI sobre ese histórico.
3. Mira la vela más reciente (vela actual) y, en alertas de cruce, también la anterior.
4. Si la regla se cumple → conditionMet. Si además pasa candle-lock y el límite diario → correo.

---

EMA — media móvil exponencial

Qué es: una media del precio de cierre que da más peso a las velas recientes.

Período: número de velas de 15m que usa el cálculo. EMA(9) = 9 velas (~2h 15m). EMA(21) = 21 velas (~5h 15m).

En el panel aparece como «rápida» y «lenta», pero en la práctica es:
- EMA corta = período menor (sigue más de cerca el precio).
- EMA larga = período mayor (línea más suave, más retrasada).

El sistema no usa otra fórmula distinta: solo cambia el período. Misma lógica que en TradingView o cualquier terminal estándar (suavizado exponencial sobre el close).

---

Cuándo dispara un cruce EMA

Se necesitan dos velas seguidas. La señal es el cambio de posición entre la EMA corta y la larga.

Cruce alcista (bull / al alza):
  Vela anterior: EMA corta estaba debajo o igual que la larga.
  Vela actual:   EMA corta quedó encima de la larga.

Cruce bajista (bear / a la baja):
  Vela anterior: EMA corta estaba encima o igual que la larga.
  Vela actual:   EMA corta quedó debajo de la larga.

Ejemplo con preset 9/21 en AAPL:
  Si en la vela de las 10:00 EMA(9) ≤ EMA(21) y en la de las 10:15 EMA(9) > EMA(21) → cruce alcista confirmado en la vela 10:15.

No es señal tick a tick dentro de la vela: se confirma al cerrar y evaluar la vela de 15m.

---

RSI — índice de fuerza relativa (Wilder)

Qué mide: en una escala de 0 a 100, si las subidas recientes fueron más fuertes que las bajadas (o al revés). Se calcula solo con el close de las últimas velas (período 14 por defecto).

Cómo dispara (distinto a EMA):
- No busca un «cruce» entre dos velas.
- Mira solo la vela actual: si el RSI ya cumple el umbral, la condición es verdadera.

Preset sobreventa:  RSI de la vela actual < umbral (por defecto 30)
Preset sobrecompra: RSI de la vela actual > umbral (por defecto 70)

Al crear o editar Sobreventa/Sobrecompra puedes ajustar período (2–50) y umbral (0–100). El operador queda fijo por preset (< o >).

Ejemplo: si el RSI cierra en 28 en la vela de las 10:15 → dispara sobreventa.
Si en la siguiente vela el RSI sigue en 27, la condición sigue cumplida pero no recibes otro correo por la misma vela (candle-lock).

Custom RSI: eliges período (2–50), umbral (0–100) y si la condición es «menor que» o «mayor que».

---

Resumen: EMA vs RSI

| | EMA (cruce) | RSI (umbral) |
|---|-------------|--------------|
| Velas que compara | Actual + anterior | Solo actual |
| Tipo de señal | Cambio de relación entre dos medias | Valor en zona extrema |
| Ejemplo preset | EMA(9) cruza arriba de EMA(21) | RSI(14) < 30 |

---

Presets

| Panel | ID | Períodos | Cuándo dispara el correo |
|-------|-----|----------|--------------------------|
| Impulso alcista corto | ema_cross_bull | EMA 9 y 21 | EMA(9) cruza arriba de EMA(21) entre vela anterior y actual |
| Impulso bajista corto | ema_cross_bear | EMA 9 y 21 | EMA(9) cruza abajo de EMA(21) entre vela anterior y actual |
| Cruce alcista largo plazo | golden_cross | EMA 50 y 200 | EMA(50) cruza arriba de EMA(200) |
| Cruce bajista largo plazo | death_cross | EMA 50 y 200 | EMA(50) cruza abajo de EMA(200) |
| Sobreventa | rsi_oversold | RSI(14) por defecto | RSI < umbral (default 30) en la vela actual; período y umbral editables |
| Sobrecompra | rsi_overbought | RSI(14) por defecto | RSI > umbral (default 70) en la vela actual; período y umbral editables |

Golden/Death Cross en 15m ≠ mismo evento en gráfico diario (más ruido en intradía).

Custom EMA: ema_fast y ema_slow (2–200, rápida < lenta), direction up/down.
Custom **Precio vs media**: el cierre cruza SMA o EMA de período N (2–200), direction up/down. Recomendado **SMA** si comparas con TradingView (`ma`).
Custom RSI: period (2–50), threshold (0–100), operator < o >.
No se combina EMA + RSI en una sola alerta (v1).

---

Alerta temprana: precio vs media (ej. SMA 12 días)

Para una vista anual en TradingView (gráfico **1Y** con velas **diarias**), una media de **12 días** significa SMA(12) sobre los últimos 12 cierres diarios.

Configuración equivalente en Stock Alerts:

| Campo | Valor |
|-------|-------|
| Tipo | Personalizada → **Precio vs media** |
| Timeframe | **Diario (1D)** |
| Tipo de media | **SMA** |
| Período | **12** |
| Dirección | Precio cruza arriba (o abajo) de la media |

Se dispara cuando el **cierre** de la vela diaria cruza la línea de la media (vela actual vs anterior). Es una señal **más temprana** que un cruce EMA 9/21 en 15m, que actúa como confirmación intradía.

**Importante:** en timeframe 15m, «período 12» son 12 velas de 15 min (~3 h), **no** 12 días. Para alinear con un gráfico diario, usa timeframe **Diario**.

---

Disparo del correo

Un correo solo se envía si se cumplen las tres condiciones siguientes:

1. La regla técnica se cumple (cruce EMA, precio vs media, o umbral RSI).
2. Candle-lock: no se repite correo por la misma vela (máx. 1 por vela por alerta).
3. Límite diario: menos de 10 correos esa alerta en el día (reset a medianoche).

Correo incluye: ticker, tipo de alerta, timeframe (15m o diario), timestamp de la vela (ET).

---

Panel y límites

Crear, editar, activar/desactivar y eliminar alertas. Etiquetas: Tendencia = cruce EMA; Precio = precio vs media; Momentum = RSI.

| Límite | Valor |
|--------|-------|
| Tickers únicos activos | 15 |
| Alertas por ticker | 5 |
| Correos por alerta/día | 10 |
| Correos por vela | 1 |
| Timeframes | 15 min (presets) y diario (personalizadas) |
| SMS / push / webhook | No (v1) |
| Histórico de disparos | Sí (campana → sección Disparos; borrar a mano) |
| Auth en panel | Planificado |

---

Preguntas frecuentes

¿Qué períodos EMA usa cada preset?
9/21 (corto) o 50/200 (largo). En custom eliges ambos entre 2 y 200 velas de 15m.

¿Cuándo se confirma un cruce?
Al cerrar y evaluar la vela de 15m más reciente: compara la relación entre EMA corta y larga en esa vela y en la anterior. No es intravela.

¿El RSI es Wilder estándar?
Sí, según la implementación del worker (suavizado Wilder sobre gain/loss del close).

¿Por qué no llegó el correo si ya vi el cruce en mi terminal?
Causas habituales: alerta inactiva, fuera de horario 9:30–16:00 ET, candle-lock (ya avisó esa vela), tope 10/día, retraso de datos Twelve Data, o festivo sin datos nuevos.

¿Puedo vigilar cruce EMA y RSI <30 en el mismo ticker?
Sí, como alertas separadas (hasta 5 por símbolo).

¿Golden Cross en 15m es comparable al diario?
No. Misma lógica matemática, distinto timeframe; en 15m genera más señales.

¿Evalúa en días feriados?
El worker ejecuta si es día laborable; sin velas nuevas si el NYSE está cerrado.

¿Es recomendación de compra/venta?
No. Notificación informativa.

¿Qué tickers acepta?
Símbolos US: letras, números, punto o guion (máx. 10 caracteres). Ej. AAPL, BRK.B.

¿Puedo usar gráfico diario o solo 15m?
Los presets usan 15m. Las alertas personalizadas pueden elegir **15 minutos** o **Diario (1D)**. Para una MA de N días (ej. 12), elige Diario.

¿Puedo combinar EMA y RSI en una alerta?
No en v1.

¿La cotización del panel es tiempo real?
Referencia con posible retraso; la señal se calcula sobre velas 15m del worker, no sobre el precio mostrado en pantalla.

---

Documentación técnica: PRD.md, ARCHITECTURE.md, CONTEXT.md

Última actualización: julio 2026 — Stock Alerts v1
