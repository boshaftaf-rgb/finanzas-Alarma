-- Presets RSI pasan a velas diarias (alineados con vista 1Y / Stoch).
-- Las alertas existentes de Sobreventa/Sobrecompra deben evaluar en 1day.

UPDATE public.alerts
SET timeframe = '1day'
WHERE preset_or_custom IN ('rsi_oversold', 'rsi_overbought')
  AND timeframe IS DISTINCT FROM '1day';
