## Parent

#1

## Prioridad

**Fase 2d** — orden #5

## What to build

Tracer bullet de notificaciones: cuando una alerta cumple condición, el worker envía email en español vía Gmail SMTP respetando candle-lock y tope diario.

Regla de disparo:

```
disparar SI:
  condición_cumplida
  AND timestamp_vela_actual > last_triggered_candle (o last_triggered_candle IS NULL)
  AND emails_sent_today < 10 (tras reset si email_count_date < CURRENT_DATE)
```

Incluye:
- `EmailSender` vía SMTP (Gmail): plantilla español con ticker, tipo de alerta, timeframe 15m, timestamp de vela.
- Variables de entorno: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_APP_PASSWORD`.
- Email de destino configurable en env (papá) hasta que exista auth por usuario.
- Persistir tras disparo: `last_triggered_candle`, incrementar `emails_sent_today`, `email_count_date = CURRENT_DATE`.
- Reset diario: si `email_count_date` < hoy → `emails_sent_today = 0` antes de evaluar.
- Test integración ciclo completo con mocks (Supabase + Twelve Data + SMTP).

Verificable: con alerta que cumple condición, papá recibe un email y no se repite en la misma vela.

## Acceptance criteria

- [ ] EmailSender envía correo en español con ticker, tipo, 15m y timestamp vela
- [ ] Email de destino configurable vía variable de entorno
- [ ] Candle-lock impide más de 1 email por vela de 15 min por alerta
- [ ] Tope 10 emails por alerta por día enforced
- [ ] Reset diario de `emails_sent_today` vía `email_count_date` DATE funciona
- [ ] EMA cross dispara en cruce de vela más reciente
- [ ] RSI dispara cuando umbral se cumple en vela actual
- [ ] Test integración ciclo completo (todo mock) pasa
- [ ] `service_role` y `SMTP_APP_PASSWORD` solo en env del worker, no en frontend

## Blocked by

#7
