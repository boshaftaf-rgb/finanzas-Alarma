## Parent

#1

## Prioridad

**Fase 2b** — orden #3 (después de migración `alerts` en #4 Fase 2a)

## What to build

Tracer bullet del motor de evaluación sin APIs externas: el worker Python lee alertas activas de Supabase y las evalúa contra datos OHLCV de fixture.

Incluye:
- Scaffold `worker/` (Python, dependencias: pandas, pandas-ta, supabase-py).
- Módulos puros con tests unitarios:
  - `IndicatorEngine`: EMA y RSI sobre OHLCV conocido.
  - `AlertEvaluator`: condiciones EMA cross y RSI threshold.
  - `MarketScheduler`: lun–vie 9:30–16:00 EST.
- `AlertStore`: lectura de alertas activas vía `service_role`; actualización de `last_evaluated_at`.
- Comando one-shot: leer alertas → evaluar con fixture → loguear resultado (dispararía / no dispararía) en español.
- `Dockerfile` + `docker-compose.yml` para ejecutar el comando one-shot.

Sin Twelve Data ni Gmail SMTP en este slice. Sin auth requerido.

Verificable: `docker compose run worker --once` evalúa alertas seed y actualiza `last_evaluated_at`.

## Acceptance criteria

- [ ] `worker/` scaffold con dependencias declaradas
- [ ] Tests unitarios de IndicatorEngine pasan
- [ ] Tests unitarios de AlertEvaluator pasan (EMA cross + RSI)
- [ ] Tests unitarios de MarketScheduler pasan
- [ ] Worker lee alertas activas con service_role
- [ ] Comando one-shot evalúa contra fixture y actualiza `last_evaluated_at`
- [ ] Logs del worker en español
- [ ] Dockerfile y docker-compose funcionan para one-shot

## Blocked by

#4 (Fase 2a — migración `alerts` + seed SQL)
