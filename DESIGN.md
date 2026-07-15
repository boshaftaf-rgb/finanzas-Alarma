---
version: "1.0"
name: stock-alerts-design-system
description: >-
  Sistema de diseño oficial para Stock Alerts (finanzas-Alarma). Modo oscuro OLED,
  acento esmeralda, tipografía Fira. Panel de alertas técnicas en español.
  Stack objetivo: React + Vite. Referencia de tokens para CSS variables.
product: Stock Alerts
locale: es-MX
stack: react-vite

colors:
  canvas: "#0B0F14"
  canvas-elevated: "#0F172A"
  canvas-subtle: "#151C28"
  surface: "#1A2332"
  surface-hover: "#1F2A3D"
  border-default: "#2A3548"
  border-strong: "#3D4F6F"
  border-focus: "#34D399"
  ink: "#F8FAFC"
  ink-secondary: "#CBD5E1"
  ink-muted: "#94A3B8"
  ink-faint: "#64748B"
  action-primary: "#10B981"
  action-primary-hover: "#34D399"
  action-primary-pressed: "#059669"
  on-primary: "#042F1E"
  accent-secondary: "#6EE7B7"
  bullish: "#22C55E"
  bullish-soft: "#22C55E1A"
  bearish: "#EF4444"
  bearish-soft: "#EF44441A"
  warning: "#F59E0B"
  warning-soft: "#F59E0B1A"
  border-error: "#F87171"
  surface-error: "#450A0A"
  skeleton-base: "#1A2332"
  skeleton-shine: "#243044"

typography:
  font-sans: "'Fira Sans', system-ui, -apple-system, sans-serif"
  font-mono: "'Fira Code', ui-monospace, monospace"
  display-lg:
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
  heading-lg:
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
  heading-md:
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
  body-md:
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  mono-ticker:
    fontFamily: "{typography.font-mono}"
    fontSize: 14px
    fontWeight: 500
    letterSpacing: 0.02em

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  card: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 48px

motion:
  duration-fast: 150ms
  duration-normal: 220ms
  duration-skeleton: 1400ms
  ease-out: "cubic-bezier(0.22, 1, 0.36, 1)"
---

# Stock Alerts — Sistema de diseño v1.0

## Overview

**Stock Alerts** es un panel de alertas técnicas bursátiles. El look & feel combina:

- **Oscuro OLED** — fondo profundo, bajo brillo, cómodo para revisar alertas fuera del horario de mercado.
- **Esmeralda** — acento principal en CTAs y estados activos; evoca señales alcistas sin saturar la UI.
- **Fira Sans + Fira Code** — legible en formularios; monoespaciada para tickers y parámetros EMA/RSI.
- **Densidad equilibrada** — listado escaneable sin parecer terminal de trading.

Inspiración de interacción: Linear, Stripe, Vercel. Reglas de estados dinámicos y botones loading: skill **ux-ui-experto**.

**Idioma UI:** español en copy, labels y mensajes de error.

---

## Identidad visual

| Pilar | Traducción en UI |
|-------|------------------|
| **Claridad** | Jerarquía tipográfica fuerte; tickers en mono; presets con nombres legibles |
| **Confianza** | Paleta sobria; sin animaciones llamativas; estados de error explícitos |
| **Calma** | OLED sin neón; un CTA esmeralda por vista; rojo/verde solo para semántica de mercado |

---

## Tokens CSS (implementación)

Copiar en `frontend/src/styles/tokens.css` o equivalente:

```css
:root {
  /* Surfaces */
  --color-canvas: #0B0F14;
  --color-canvas-elevated: #0F172A;
  --color-canvas-subtle: #151C28;
  --color-surface: #1A2332;
  --color-surface-hover: #1F2A3D;

  /* Borders */
  --color-border-default: #2A3548;
  --color-border-strong: #3D4F6F;
  --color-border-focus: #34D399;

  /* Text */
  --color-ink: #F8FAFC;
  --color-ink-secondary: #CBD5E1;
  --color-ink-muted: #94A3B8;
  --color-ink-faint: #64748B;

  /* Action */
  --color-action-primary: #10B981;
  --color-action-primary-hover: #34D399;
  --color-action-primary-pressed: #059669;
  --color-on-primary: #042F1E;

  /* Market semantics */
  --color-bullish: #22C55E;
  --color-bullish-soft: rgba(34, 197, 94, 0.12);
  --color-bearish: #EF4444;
  --color-bearish-soft: rgba(239, 68, 68, 0.12);
  --color-warning: #F59E0B;
  --color-warning-soft: rgba(245, 158, 11, 0.12);

  /* Feedback */
  --color-border-error: #F87171;
  --color-surface-error: #450A0A;

  /* Skeleton */
  --color-skeleton-base: #1A2332;
  --color-skeleton-shine: #243044;

  /* Typography */
  --font-sans: "Fira Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "Fira Code", ui-monospace, monospace;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-card: 16px;
  --radius-full: 9999px;

  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 220ms;
  --duration-skeleton: 1.4s;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Google Fonts:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

---

## Colors

### Regla cromática

```
Fondo página        → canvas (#0B0F14)
Tarjetas / paneles  → surface (#1A2332) sobre canvas-elevated
CTA principal       → action-primary (esmeralda) — UNO por vista
Links secundarios   → action-primary-hover o ink-secondary subrayado
Alcista / bajista   → bullish / bearish — solo badges, chips y gráficos semánticos
Errores             → border-error + surface-error — NUNA esmeralda
Focus               → border-focus (#34D399) + halo suave
```

### Semántica de trading

| Token | Uso |
|-------|-----|
| `bullish` | Cruce alcista, Golden Cross, RSI saliendo de sobreventa |
| `bearish` | Cruce bajista, Death Cross, RSI sobrecompra |
| `warning` | Límite de tickers (15), emails/día (10), mercado cerrado |
| `action-primary` | Crear alerta, Guardar, Iniciar sesión — no confundir con alcista |

---

## Typography

| Token | Tamaño | Uso |
|-------|--------|-----|
| display-lg | 28px / 600 | Título de página («Mis alertas») |
| heading-lg | 22px / 600 | Secciones del formulario |
| heading-md | 18px / 600 | Subtítulos de tarjeta |
| body-md | 15px / 400 | Cuerpo, labels |
| body-sm | 13px / 400 | Metadatos, ayudas |
| caption | 12px / 400 | Timestamps, límites |
| mono-ticker | 14px Fira Code | AAPL, MSFT, parámetros 9/21 |

**Principios:**
- Títulos en Fira Sans 600; nunca mono en párrafos largos.
- Tickers y números técnicos siempre en `font-mono`.
- Sin letter-spacing negativo agresivo.

---

## Layout y densidad

- **Base de espaciado:** 4px; escala 8 / 12 / 16 / 24 / 32 / 48.
- **Ancho máximo del panel:** 1120px centrado.
- **Listado de alertas:** filas de ~56–64px; padding horizontal 16px; gap entre filas 8px.
- **Formulario crear/editar:** una columna en móvil; dos columnas (label + control) desde 768px.
- **Sidebar (opcional v2):** 240px fijo en desktop; drawer en móvil.

---

## Elevation

| Nivel | Tratamiento |
|-------|-------------|
| 0 | Sin sombra; borde `border-default` |
| 1 | `box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35)` en cards |
| 2 | `box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45)` en modales |

Sin sombras de color (esmeralda/rojo). Profundidad neutra sobre OLED.

---

## Components

### `button-primary`

- Fondo `action-primary`, texto `on-primary`.
- `border-radius: full` (píldora).
- Altura mínima 44px; padding 12px 24px.
- Hover → `action-primary-hover`; active scale 0.98.
- Focus: `outline: 2px solid border-focus; outline-offset: 2px`.
- **Loading:** patrón ux-ui-experto §3.C — label y spinner mutuamente excluyentes.

### `button-secondary`

- Fondo transparente; borde `border-strong`; texto `ink`.
- Hover: `surface-hover`.

### `button-ghost`

- Sin borde; texto `ink-muted`; hover `ink`.

### `button-danger`

- Fondo `bearish-soft`; texto `bearish`; borde `bearish` al 40%.
- Solo para eliminar alerta (confirmación).

### `input-text` / `select`

- Fondo `canvas-subtle`; borde `border-default`; texto `ink`.
- Altura mínima 44px; `border-radius: sm`.
- Focus: borde 2px `border-focus` + `box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2)`.
- Error: borde `border-error`; fondo `surface-error`.

### `card`

- Fondo `surface`; `border-radius: card`; padding 20px (móvil 16px).
- Borde 1px `border-default`.

### `alert-row`

- Fila del listado: ticker mono + nombre preset + badge estado + toggle activo.
- Hover: `surface-hover`.
- Estado inactivo: opacidad 0.65 en texto secundario.

### `badge-active` / `badge-inactive`

| Badge | Fondo | Texto |
|-------|-------|-------|
| Activa | `bullish-soft` | `bullish` |
| Inactiva | `canvas-subtle` | `ink-muted` |

### `badge-preset-ema` / `badge-preset-rsi`

- EMA: borde `action-primary` al 30%; texto `accent-secondary`.
- RSI: borde `warning` al 30%; texto `warning`.

### `chip-timeframe`

- Chip compacto (caption mono) para temporalidad: **Diario** o **15 min**.
- `chip-timeframe--daily`: borde esmeralda suave; texto `accent-secondary`.
- `chip-timeframe--intraday`: borde `warning` suave; texto `warning`.
- Uso: cards de preset, filas del listado y cabecera del resumen de señal.

### `signal-summary`

- Bloque en el modal de crear/editar alerta (`aria-live="polite"`).
- Fondo `canvas-subtle`, borde `border-default`, radius `md`.
- Muestra: qué se vigila, velas (diario/15m), disparo y frase de verificación Yahoo/TradingView.
- Estado vacío: placeholder «Selecciona un tipo de alerta…».

### `preset-group`

- Grid de presets bajo «Vista diaria / 1Y» (todas las alertas usan velas diarias).
- Título de grupo: caption uppercase `ink-faint`.

### `toggle`

- Track off: `border-strong`; thumb `ink-faint`.
- Track on: `action-primary`; thumb blanco.
- Transición 150ms.

### `alert-banner-error` / `alert-banner-success`

- Error: `surface-error` + borde `border-error`.
- Success: `bullish-soft` + borde `bullish` al 40%.

---

## Pantallas v1

### `screen-auth-login`

- Centrado vertical; card `surface` max-width 400px sobre `canvas`.
- Logo/nombre «Stock Alerts» + subtítulo en `ink-muted`.
- Un CTA esmeralda «Iniciar sesión».
- Link «¿Olvidaste tu contraseña?» en `action-primary-hover`.

### `screen-auth-register`

- Igual que login + campo «Código de invitación».
- Mensaje de error genérico en credenciales inválidas.

### `screen-alerts-list`

- Header: título + contador «12 / 15 tickers» + CTA «Nueva alerta».
- Tabla/lista con skeleton al cargar.
- Empty state: ilustración mínima + «Aún no tienes alertas» + CTA.

### `screen-alert-form`

- Selector ticker (mono).
- Grid de presets (Vista diaria / 1Y); cards con chip Diario.
- Sección custom colapsable (EMA **o** RSI u otros indicadores).
- Timeframe fijado a Diario (1D).
- Resumen de la señal en vivo (chip + verificación Yahoo) antes de Guardar.
- Footer fijo en móvil: Guardar + Cancelar.

---

## Loading & skeletons

Reglas **obligatorias** (ux-ui-experto):

1. **Cero pantallas en blanco** — skeleton que imita filas de alerta o campos del formulario.
2. **Anti layout-shift** — skeleton y contenido en la misma celda CSS Grid; alternar `visibility`.
3. **Shimmer** — gradiente neutro sobre `skeleton-base` / `skeleton-shine`; ciclo ~1.4s.
4. **`aria-busy="true"`** en contenedor durante carga.
5. **`prefers-reduced-motion`** — desactivar shimmer.

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 0%,
    var(--color-skeleton-shine) 50%,
    var(--color-skeleton-base) 100%
  );
  background-size: 200% 100%;
  animation: shimmer var(--duration-skeleton) ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```

---

## Motion

| Elemento | Tratamiento |
|----------|-------------|
| Hover botones | `background-color` 150ms |
| Toggle / badges | 150ms ease-out |
| Modales | fade + translateY 8px, 220ms |
| Listas | sin animación de entrada por fila en v1 |

**No usar** `transition: all`. Solo propiedades explícitas.

---

## Do's and Don'ts

### Do

- Mantener **un** CTA esmeralda por vista.
- Usar rojo/verde solo para semántica de mercado o estado activo/inactivo.
- Tickers en Fira Code.
- Contraste WCAG AA mínimo (`ink` sobre `surface`).
- Iconos SVG (Lucide / Heroicons); sin emojis como iconos.
- `cursor: pointer` en elementos clicables.

### Don't

- No saturar con verde esmeralda en toda la UI.
- No usar esmeralda para errores de validación.
- No gradientes neón ni glassmorphism pesado (legibilidad OLED).
- No más de un badge de color fuerte por fila de alerta.
- No spinners genéricos a pantalla completa si hay estructura conocida.

---

## Responsive

| Breakpoint | Cambios |
|------------|---------|
| < 768px | Una columna; CTA full-width; formulario apilado |
| 768–1023px | Listado con acciones en menú ⋯ |
| ≥ 1024px | Layout completo; sidebar opcional |
| ≥ 1440px | max-width 1120px centrado |

Touch targets mínimos: **44×44px**.

---

## Relación con otras guías

| Documento | Rol |
|-----------|-----|
| **`AGENTS.md`** | Agentes deben leer este archivo antes de UI |
| **`ux-ui-experto`** | Estados dinámicos, skeletons, botones loading |
| **`ui-ux-pro-max`** | Exploración inicial de paletas (esmeralda + OLED validados) |
| **`emil-design-eng`** | Pulir micro-interacciones y shimmer |
| **`SECURITY.md`** | Errores de auth genéricos; sin filtrar datos en UI |

---

## Changelog

### v1.0

- Diagnóstico UX/UI Experto: OLED + esmeralda + Fira + redondeado moderno + densidad equilibrada.
- Tokens, componentes base y pantallas v1 definidos.

---

*Stock Alerts — alertas técnicas con claridad, no ruido visual.*
