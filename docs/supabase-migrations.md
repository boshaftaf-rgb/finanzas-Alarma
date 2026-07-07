# Migraciones Supabase

Corresponde al [Issue #4 Fase 2a](https://github.com/boshaftaf-rgb/finanzas-Alarma/issues/4).

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `supabase/migrations/20260307130000_create_alerts.sql` | Tabla `alerts`, índices, triggers de límites |
| `supabase/seed.sql` | 3 alertas activas + 1 inactiva para papá |

## Aplicar (opción A — script)

1. En Supabase Dashboard → **Project Settings → Database → Connection string → URI** (modo Session).
2. Añade a tu `.env`:

   ```
   DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@...
   ```

3. Desde la raíz del repo:

   ```bash
   pip install -r requirements-dev.txt
   python scripts/apply_migrations.py
   pytest tests/test_alert_triggers.py -v
   ```

## Aplicar (opción B — SQL Editor)

1. Abre **SQL Editor** en Supabase.
2. Pega y ejecuta el contenido de `supabase/migrations/20260307130000_create_alerts.sql`.
3. Pega y ejecuta el contenido de `supabase/seed.sql`.

## Verificar

En SQL Editor:

```sql
SELECT ticker, preset_or_custom, active
FROM public.alerts
ORDER BY ticker;
```

Deberías ver AAPL, MSFT, NVDA (activas) y TSLA (inactiva).

## user_id en v1

Sin auth, todas las alertas del seed usan:

```
00000000-0000-0000-0000-000000000001
```

Se reemplazará por `auth.uid()` real cuando exista el issue #3.

## Límites (triggers)

- Máx. **5 alertas activas** por (`user_id`, `ticker`)
- Máx. **15 tickers únicos activos** por `user_id`
- Alertas inactivas no cuentan para ningún límite
