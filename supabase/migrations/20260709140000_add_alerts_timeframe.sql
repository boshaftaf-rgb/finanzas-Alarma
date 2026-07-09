-- Timeframe por alerta: 15min (default) o diario (1day)

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS timeframe TEXT NOT NULL DEFAULT '15min'
  CONSTRAINT alerts_timeframe_valid CHECK (timeframe IN ('15min', '1day'));

COMMENT ON COLUMN public.alerts.timeframe IS 'Intervalo de velas para evaluar la alerta: 15min o 1day.';
