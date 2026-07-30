-- Snapshot de valores detectados al disparar (mismo contenido que el email de alarma).

ALTER TABLE public.alert_firings
    ADD COLUMN IF NOT EXISTS close_price NUMERIC,
    ADD COLUMN IF NOT EXISTS value_lines TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.alert_firings.close_price IS 'Cierre de la vela al disparar (nullable en disparos antiguos).';
COMMENT ON COLUMN public.alert_firings.value_lines IS 'Líneas de indicadores detectados (p. ej. RSI(14): 28.7).';
