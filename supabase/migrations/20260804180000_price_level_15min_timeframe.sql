-- Precio objetivo (price_level): evaluación intradía en velas de 15 min.
-- Resto de alertas permanecen en 1day (vista 1Y).

UPDATE public.alerts
SET timeframe = '15min'
WHERE preset_or_custom = 'custom'
  AND params->>'type' = 'price_level'
  AND timeframe IS DISTINCT FROM '15min';
