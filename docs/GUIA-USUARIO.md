Stock Alerts — Guía para perfil financiero

Monitor técnico automatizado: acciones EE. UU., velas **diarias**, señales EMA (cruces), RSI/Stochastic (umbrales) o precio, aviso por correo. No ejecuta órdenes ni es asesoría. Datos: Twelve Data (posible ligero retraso en plan gratuito).

---

Ficha operativa

| Parámetro | Valor |
|-----------|-------|
| Universo | Acciones EE. UU. (ej. AAPL, BRK.B) |
| Timeframe | **Diario (1D)** para todas las alertas (como gráfico 1Y / intervalo 1 día) |
| Precio usado | Close de cada vela |
| Evaluación | Cada 5 min, lun–vie 9:30–16:00 ET (America/New_York) |
| Pre/post market | No |
| Festivos NYSE | No excluidos (worker corre; sin datos si mercado cerrado) |
| Indicadores | EMA (cruce), RSI Wilder (umbral), Stochastic %K (umbral) |
| Salida | Correo en español |

---

Definición de señales

Cómo evalúa el worker

1. Descarga velas diarias con su precio de cierre.
2. Calcula EMA, RSI y/o Stochastic sobre ese histórico.
3. Mira la vela más reciente (vela actual) y, en alertas de cruce, también la anterior.
4. Si la regla se cumple → conditionMet. Si además pasa candle-lock y el límite diario → correo.

---

EMA — media móvil exponencial

Qué es: una media del precio de cierre que da más peso a las velas recientes.

Período: número de velas **diarias** que usa el cálculo. EMA(9) = 9 días. EMA(21) = 21 días.

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
  Si en la vela de ayer EMA(9) ≤ EMA(21) y en la de hoy EMA(9) > EMA(21) → cruce alcista confirmado en la vela diaria de hoy.

No es señal tick a tick intradía: se confirma al cerrar y evaluar la vela diaria.

---

RSI — índice de fuerza relativa (Wilder)

Qué mide: en una escala de 0 a 100, si las subidas recientes fueron más fuertes que las bajadas (o al revés). Se calcula solo con el close de las últimas velas (período 14 por defecto).

Cómo dispara (distinto a EMA):
- No busca un «cruce» entre dos velas.
- Mira solo la vela actual: si el RSI ya cumple el umbral, la condición es verdadera.

Preset sobreventa:  RSI de la vela **diaria** actual < umbral (por defecto 30)
Preset sobrecompra: RSI de la vela **diaria** actual > umbral (por defecto 70)

Período por defecto: **14** (= **14 días**, alineado a un gráfico diario/1Y). Al crear o editar Sobreventa/Sobrecompra puedes ajustar período (2–50) y umbral (0–100). El operador queda fijo por preset (< o >).

Ejemplo: si el RSI cierra en 28 en la vela diaria de hoy → dispara sobreventa.
Si al día siguiente el RSI sigue en 27, la condición sigue cumplida pero no recibes otro correo por la misma vela (candle-lock).

Custom RSI: eliges período (2–50), umbral (0–100) y operador «menor que» o «mayor que» (siempre en velas diarias).

---

Stochastic — Fast %K

El Stochastic %K mide dónde está el cierre respecto al rango high–low de las últimas N velas (0–100).

- Mira solo la vela actual: si el %K ya cumple el umbral, la condición es verdadera.
- No usa línea %D ni cruces K/D en v1.

Preset sobreventa Stoch:  Stoch de la vela **diaria** actual < umbral (por defecto 20)
Preset sobrecompra Stoch: Stoch de la vela **diaria** actual > umbral (por defecto 80)

Período por defecto: **7** (= **7 días**, útil junto a un gráfico diario/1Y). Al crear o editar puedes ajustar período (2–50) y umbral (0–100).

Custom Stoch: period (2–50), threshold (0–100), operator < o > (velas diarias).

---

Resumen: EMA vs RSI / Stoch

| | EMA (cruce) | RSI / Stoch (umbral) |
|---|-------------|----------------------|
| Velas que compara | Actual + anterior | Solo actual |
| Tipo de señal | Cambio de relación entre dos medias | Valor en zona extrema |
| Ejemplo preset | EMA(9) cruza arriba de EMA(21) | RSI(14) < 30 · Stoch(7) < 20 |

---

Presets

| Panel | ID | Períodos | Cuándo dispara el correo |
|-------|-----|----------|--------------------------|
| Impulso alcista corto | ema_cross_bull | EMA 9 y 21 **diario** | EMA(9) cruza arriba de EMA(21) en vela diaria |
| Impulso bajista corto | ema_cross_bear | EMA 9 y 21 **diario** | EMA(9) cruza abajo de EMA(21) en vela diaria |
| Cruce alcista largo plazo | golden_cross | EMA 50 y 200 **diario** | EMA(50) cruza arriba de EMA(200) en vela diaria |
| Cruce bajista largo plazo | death_cross | EMA 50 y 200 **diario** | EMA(50) cruza abajo de EMA(200) en vela diaria |
| Sobreventa | rsi_oversold | RSI(14) **diario** | RSI < umbral (default 30) en la vela diaria; período y umbral editables |
| Sobrecompra | rsi_overbought | RSI(14) **diario** | RSI > umbral (default 70) en la vela diaria; período y umbral editables |
| Sobreventa Stoch | stoch_oversold | Stoch(7) **diario** | Stoch < umbral (default 20) en la vela diaria; período y umbral editables |
| Sobrecompra Stoch | stoch_overbought | Stoch(7) **diario** | Stoch > umbral (default 80) en la vela diaria; período y umbral editables |

Todas las alertas EMA (9/21 y 50/200) usan **velas diarias** (vista 1Y).

Custom EMA: ema_fast y ema_slow (2–200, rápida < lenta), direction up/down.
Custom **Precio vs media**: el cierre cruza SMA o EMA de período N (2–200), direction up/down. Recomendado **SMA** si comparas con TradingView (`ma`).
Custom **Precio objetivo**: el cierre cruza un nivel fijo (`level` > 0) con operador `>=` o `<=` (evento de cruce entre vela anterior y actual).
Custom **Rango de precios**: piso (`low`) y techo (`high`); se dispara al salir del canal por arriba o por abajo.
Custom RSI: period (2–50), threshold (0–100), operator < o >.
Custom Stochastic: period (2–50), threshold (0–100), operator < o >. Recomendado timeframe **Diario** si el período representa días.
No se combina EMA + RSI + Stochastic + precio en una sola alerta (v1).

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

Se dispara cuando el **cierre** de la vela diaria cruza la línea de la media (vela actual vs anterior).

**Importante:** el período N son N **días** bursátiles (gráfico diario / 1Y).

---

Precio objetivo (nivel fijo)

Para avisar cuando la acción **llega** a un precio que eliges tú (no una media móvil):

| Campo | Valor |
|-------|-------|
| Tipo | Personalizada → **Precio objetivo** |
| Timeframe | **Diario (1D)** |
| Precio objetivo | Nivel en USD (ej. 185.5) |
| Condición | Cierre alcanza o supera (`>=`) o baja hasta o por debajo (`<=`) |

Se dispara solo en el **cruce del nivel** (vela anterior en un lado, actual en el otro o en el nivel). Si el precio ya estaba por encima/debajo, no vuelve a avisar en cada vela.

---

Rango de precios (piso y techo)

Para avisar cuando la acción **sale** de un canal que tú defines:

| Campo | Valor |
|-------|-------|
| Tipo | Personalizada → **Rango de precios** |
| Timeframe | **Diario (1D)** |
| Piso (a la baja) | Precio inferior del canal (ej. 100) |
| Techo (al alza) | Precio superior del canal (ej. 120) |

Se dispara en el **cruce del techo** (≥) o del **piso** (≤). Mientras el cierre siga fuera del rango, no reenvía en cada vela (solo el evento de salida).

---

Disparo del correo

Un correo solo se envía si se cumplen las tres condiciones siguientes:

1. La regla técnica se cumple (cruce EMA, precio vs media, precio objetivo, rango, o umbral RSI/Stoch).
2. Candle-lock: no se repite correo por la misma vela (máx. 1 por vela por alerta).
3. Límite diario: menos de 10 correos esa alerta en el día (reset a medianoche).

Correo incluye: ticker, tipo de alerta, timeframe (diario), timestamp de la vela (ET).

---

Panel y límites

Crear, editar, activar/desactivar y eliminar alertas. Etiquetas: Tendencia = cruce EMA; Precio = precio vs media, precio objetivo o rango; Momentum = RSI o Stochastic.

Los presets aparecen bajo **Vista diaria / 1Y**. Cada card y cada fila del listado muestran el chip **Diario**.

Al crear o editar, el bloque **Resumen de la señal** indica qué se vigila, que las velas son diarias, cuándo dispara y cómo verificarlo en Yahoo/TradingView (intervalo **1 día**; el rango 1Y solo es la vista del gráfico).

El listado agrupa alertas por ticker. Puedes **arrastrar el asidero** (⋮⋮) de cada grupo para cambiar el orden; el orden se guarda y se mantiene al recargar. Un ticker nuevo aparece al final hasta que lo muevas.

| Límite | Valor |
|--------|-------|
| Tickers únicos activos | 15 |
| Alertas por ticker | 5 |
| Correos por alerta/día | 10 |
| Correos por vela | 1 |
| Timeframes | Diario (1D) para todas las alertas |
| SMS / push / webhook | No (v1) |
| Histórico de disparos | Sí (campana → sección Disparos; borrar a mano) |
| Auth en panel | Planificado |

---

Preguntas frecuentes

¿Qué períodos EMA usa cada preset?
9/21 (impulso corto) o 50/200 (Golden/Death), ambos en **velas diarias**. En custom eliges períodos entre 2 y 200 (también diarios).

¿Cuándo se confirma un cruce?
Al cerrar y evaluar la vela **diaria** más reciente: compara la relación entre EMA corta y larga en esa vela y en la anterior. No es intradía.

¿El RSI es Wilder estándar?
Sí, según la implementación del worker (suavizado Wilder sobre gain/loss del close).

¿Por qué no llegó el correo si ya vi el cruce en mi terminal?
Causas habituales: alerta inactiva, fuera de horario 9:30–16:00 ET, candle-lock (ya avisó esa vela), tope 10/día, retraso de datos Twelve Data, o festivo sin datos nuevos.

¿Puedo vigilar cruce EMA y RSI <30 en el mismo ticker?
Sí: crea dos alertas distintas (hasta 5 por ticker).

¿Golden Cross es el de gráfico diario/1Y?
Sí: todos los presets (incluido impulso 9/21 y Golden/Death) usan **Diario (1D)**.

¿Evalúa en días feriados?
El worker ejecuta si es día laborable; sin velas nuevas si el NYSE está cerrado.

¿Es recomendación de compra/venta?
No. Notificación informativa.

¿Qué tickers acepta?
Símbolos US: letras, números, punto o guion (máx. 10 caracteres). Ej. AAPL, BRK.B.

¿Puedo usar gráfico diario o solo 15m?
En v1 **todas** las alertas usan **Diario (1D)**. Para verificar, en Yahoo/TradingView pon intervalo **1 día** (el rango 1Y solo es la vista).

¿Cómo verifico la señal en Yahoo o TradingView?
Usa intervalo **1 día**. El rango del gráfico (1Y, 1M…) solo cambia lo que ves en pantalla, no el cálculo del indicador.

¿Puedo combinar EMA y RSI/Stoch en una alerta?
No en v1.

¿La cotización del panel es tiempo real?
Referencia con posible retraso; la señal se calcula sobre velas **diarias** del worker, no sobre el precio mostrado en pantalla.

---

Documentación técnica: PRD.md, ARCHITECTURE.md, CONTEXT.md

Última actualización: julio 2026 — Stock Alerts v1
