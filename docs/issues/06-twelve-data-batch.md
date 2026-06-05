## Parent

#1

## Prioridad

**Fase 2c** — orden #4

## What to build

Conectar el worker a Twelve Data con **batching**: un solo request por ciclo trae OHLCV de todos los tickers únicos (velas 15 min).

Incluye:
- `DataFetcher`: deduplica tickers de alertas activas → una petición `symbols=AAPL,MSFT,...&interval=15min`.
- Integrar fetch real en el ciclo del worker (reemplaza fixture como fuente primaria; fixture queda para tests).
- `MarketScheduler` gate: fuera de horario mercado (lun–vie 9:30–16:00 EST) el worker no llama a Twelve Data.
- Test de integración con HTTP mock: N alertas con tickers solapados producen exactamente 1 request con símbolos únicos.

Verificable: con alertas activas reales y API key, un ciclo descarga todos los tickers en una sola petición y calcula indicadores.

## Acceptance criteria

- [ ] DataFetcher deduplica tickers y hace 1 request batch por ciclo
- [ ] Intervalo de velas es 15 minutos
- [ ] Worker no consulta Twelve Data fuera de horario de mercado
- [ ] Indicadores se calculan sobre datos reales de Twelve Data
- [ ] Test de batching con HTTP mock pasa (1 request, símbolos únicos)
- [ ] `last_evaluated_at` se actualiza tras cada ciclo con datos reales

## Blocked by

#6
