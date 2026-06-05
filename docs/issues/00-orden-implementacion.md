# Orden de implementación (v1 sin auth)

Único usuario en v1: papá. Auth pospuesto — ver #3.

## Ahora

| Orden | Issue | Qué |
|-------|-------|-----|
| 1 | [#2](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/2) | Servicios: Supabase + Twelve Data + Gmail SMTP |
| 2 | [#4](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/4) Fase 2a | Migración `alerts` + seed SQL |
| 3 | [#6](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/6) | Worker + fixtures |
| 4 | [#7](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/7) | Twelve Data batch |
| 5 | [#8](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/8) | Gmail SMTP + candle-lock |
| 6 | [#9](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/9) Fase 2e | Docker loop producción |

**Hito:** papá recibe alertas por email (alertas configuradas vía SQL).

## Después

| Orden | Issue | Qué |
|-------|-------|-----|
| 7 | [#4](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/4) Fase 3a | Panel presets sin login |
| 8 | [#5](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/5) | Alertas custom EMA/RSI |
| 9 | [#9](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/9) Fase 3c | Deploy Vercel |

## Más adelante

| Issue | Qué |
|-------|-----|
| [#3](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/3) | Auth + códigos de invitación + RLS por usuario |
