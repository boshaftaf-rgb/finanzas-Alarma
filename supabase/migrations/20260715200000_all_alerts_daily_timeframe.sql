-- Producto modo 1Y: todas las alertas evalúan en velas diarias.

UPDATE public.alerts
SET timeframe = '1day'
WHERE timeframe IS DISTINCT FROM '1day';
