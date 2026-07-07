---
version: "1.0"
name: stock-alerts-clean-code-manifesto
description: >-
  Manifiesto de arquitectura limpia para Stock Alerts (finanzas-Alarma). Directrices para
  mantener el código modular, legible y mantenible — especialmente al trabajar
  con generación asistida por IA. Complementa SECURITY.md.
---

# Manifiesto de arquitectura limpia — escribiendo para humanos

Este documento establece las directrices fundamentales para mantener el código libre de **código espagueti** y de deuda técnica generada por automatización indiscriminada.

**Premisa:**

> Las máquinas escriben para que funcione hoy; los humanos diseñan para que sea mantenible mañana.

---

## 1. Modularidad extrema — divide y vencerás

La IA tiende a colocar demasiada lógica en un solo archivo masivo. Nosotros construimos sistemas modulares, separados y fáciles de mantener.

### Regla de oro

Cada función, clase o archivo debe tener **una única responsabilidad**.

### Separación de conceptos

En Stock Alerts, el módulo que descarga velas de Twelve Data **no** debe ser el mismo que:

- Calcula indicadores (EMA, RSI).
- Evalúa condiciones de alerta.
- Envía correos SMTP.
- Persiste estado en Supabase.

Cada pieza debe tener una responsabilidad clara.

### Archivos pequeños

Si un archivo supera las **200–300 líneas**, probablemente está haciendo demasiadas cosas. Antes de segregar más código, divídelo en módulos más específicos.

---

## 2. Control de flujo predecible — evita el «arrow code»

El código autogenerado suele abusar de condicionales anidados:

```text
if condicion:
    if otra_condicion:
        if otra_mas:
            hacer_algo()
```

Eso crea una estructura en forma de flecha difícil de leer y mantener.

### Usa cláusulas de guarda

Maneja errores, casos inválidos y condiciones de salida **al inicio** de la función.

**Incorrecto — anidado y confuso:**

```python
def evaluar_alerta(alerta, velas):
    if alerta is not None:
        if alerta.get("activa"):
            if len(velas) >= 2:
                if cruce_ema(velas, alerta):
                    enviar_email(alerta)
                    return True
    return False
```

**Correcto — plano y directo:**

```python
def evaluar_alerta(alerta, velas):
    if not alerta or not alerta.get("activa"):
        return False
    if len(velas) < 2:
        return False
    if not cruce_ema(velas, alerta):
        return False

    enviar_email(alerta)
    return True
```

El flujo debe leerse de arriba hacia abajo como una historia lógica.

---

## 3. Nomenclatura semántica e intencional

Nombrar variables, funciones y clases es responsabilidad humana. Los nombres deben revelar intención, contexto y propósito.

**Prohibido** usar nombres perezosos o genéricos:

`data`, `res`, `temp`, `val`, `info`, `process_item_v2`

### Variables y constantes

Deben describir el dato que contienen, no solo su tipo técnico.

| Incorrecto | Correcto |
|------------|----------|
| `lista = ["AAPL", "MSFT"]` | `tickers_activos = ["AAPL", "MSFT"]` |
| `n = 14` | `periodo_rsi = 14` |

### Funciones y métodos

Deben comenzar con un **verbo** que describa la acción exacta:

- `obtener_velas_batch()`
- `calcular_ema()`
- `evaluar_cruce_ema()`
- `enviar_alerta_por_email()`

### Booleanos

Deben sonar como una pregunta que se responde con sí o no:

- `es_horario_mercado = True`
- `tiene_candle_lock = False`
- `puede_enviar_email = True`

---

## 4. Comentarios estratégicos — explica el «por qué», no el «qué»

El código limpio debe explicarse a sí mismo. La IA suele comentar lo obvio:

```python
i = i + 1  # Incrementa el contador en uno  ← sin valor
```

### Regla

No escribas un comentario si puedes reescribir la variable, función o estructura para que sea más clara.

**Buen comentario:**

```python
# Candle-lock: máximo un email por vela de 15 min para evitar spam mientras la condición persiste.
if ultima_vela_id == alerta.get("last_triggered_candle_id"):
    return False
```

Usa comentarios solo para documentar:

- Decisiones de diseño técnico.
- Restricciones de APIs externas (Twelve Data free tier, Gmail límites).
- Algoritmos complejos (cálculo de cruces EMA).
- Workarounds necesarios.

---

## 5. Desacoplamiento de configuración y estado

La mezcla de configuraciones hardcodeadas, variables globales y lógica operativa es una de las causas principales del código espagueti.

### No hagas hardcoding

Evita colocar directamente en la lógica principal:

- URLs de APIs (Twelve Data, Supabase).
- Credenciales y tokens.
- Puertos y timeouts.
- Límites operativos (10 emails/día, 15 tickers).

**Incorrecto:**

```python
API_KEY = "abc123"
MAX_EMAILS = 10
```

**Correcto:**

```python
API_KEY = os.environ["TWELVE_DATA_API_KEY"]
MAX_EMAILS = int(os.environ.get("MAX_EMAILS_PER_ALERT_PER_DAY", 10))
```

Los valores deben vivir en `.env` o variables de entorno — nunca en el repositorio. Ver también **`SECURITY.md`** (gestión de secretos).

---

## 6. Estado y mutabilidad controlada

El código espagueti nace cuando el estado global es modificado por múltiples funciones de manera impredecible.

### Evita variables globales

Las funciones no deben depender de valores escondidos fuera de su contexto.

### Prefiere inyección de dependencias

**Correcto:**

```python
def evaluar_alertas(supabase_client, twelve_data_client, smtp_sender):
    alertas = supabase_client.obtener_alertas_activas()
    velas = twelve_data_client.obtener_velas_batch(alertas)
    for alerta in alertas:
        if condicion_cumplida(alerta, velas):
            smtp_sender.enviar(alerta)
```

### Prefiere funciones puras cuando sea posible

```python
def calcular_rsi(cierres, periodo=14):
    return ta.rsi(cierres, length=periodo)
```

---

## 7. Checklist de revisión humana

Antes de integrar, commitear o abrir un pull request, el código debe pasar este filtro:

- [ ] ¿Se lee de arriba hacia abajo como una historia lógica?
- [ ] ¿Cada función tiene una única responsabilidad?
- [ ] ¿Cada archivo está enfocado en un solo concepto o módulo?
- [ ] ¿Credenciales, URLs, tokens y configuraciones están fuera de la lógica principal?
- [ ] ¿Se eliminaron anidaciones profundas mediante cláusulas de guarda?
- [ ] ¿Los nombres de variables y funciones revelan su propósito exacto?
- [ ] ¿Los booleanos se leen como preguntas de sí o no?
- [ ] ¿Los comentarios explican decisiones técnicas y no acciones obvias?
- [ ] ¿La lógica central es independiente del entorno de ejecución?
- [ ] ¿Las dependencias se reciben por parámetros en lugar de buscarse globalmente?
- [ ] ¿Cumple **`SECURITY.md`** si toca auth, datos sensibles o integraciones externas?

---

## Código existente que funciona

Si hay módulos **ya validados en uso** (worker de polling, evaluación EMA/RSI, candle-lock, etc.) que funcionan correctamente en el entorno configurado:

**No refactorizar ni "optimizar" ese código por inercia del agente o del desarrollador.** Aplicar reglas de cambio mínimo: solo tocar lo estrictamente necesario para el bug o la feature pedida.

Lista de referencia y reglas detalladas: **`AGENTS.md`** → *Lógica validada — no tocar sin pedido explícito*.

---

## Principio final

El código no solo debe funcionar. Debe poder ser leído, entendido, corregido y extendido por otra persona sin descifrarlo como un rompecabezas.

Un buen sistema no es el que parece inteligente por ser complejo. Un buen sistema es el que parece simple porque fue diseñado con inteligencia.

---

## Frase rectora

> No escribimos código para impresionar a la máquina.
> Escribimos código para que otro humano pueda mantenerlo mañana.

---

## Relación con otras guías del repo

| Documento | Rol |
|-----------|-----|
| **`AGENTS.md`** | Indica a agentes leer este archivo antes de generar o refactorizar código |
| **`SECURITY.md`** | Secretos, auth, OWASP y datos sensibles |
| **`docs/ARCHITECTURE.md`** | Esquema, flujos y decisiones técnicas |
