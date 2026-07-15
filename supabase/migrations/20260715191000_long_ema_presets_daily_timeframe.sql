-- Golden / Death Cross pasan a velas diarias (EMA 50/200 clásicas, vista 1Y).

UPDATE public.alerts
SET timeframe = '1day'
WHERE preset_or_custom IN ('golden_cross', 'death_cross')
  AND timeframe IS DISTINCT FROM '1day';
