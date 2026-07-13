-- Disparos: registro UI de cada email enviado (sobrevive si se borra la alerta).
-- Ver docs/ARCHITECTURE.md

CREATE TABLE IF NOT EXISTS public.alert_firings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    alert_id UUID REFERENCES public.alerts (id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    preset_or_custom TEXT NOT NULL,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    timeframe TEXT NOT NULL DEFAULT '15min',
    candle_timestamp TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    label TEXT NOT NULL,
    CONSTRAINT alert_firings_ticker_format CHECK (ticker ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
    CONSTRAINT alert_firings_timeframe_valid CHECK (timeframe IN ('15min', '1day'))
);

COMMENT ON TABLE public.alert_firings IS 'Disparos: email enviado; visible en el panel hasta que el usuario lo borre.';
COMMENT ON COLUMN public.alert_firings.alert_id IS 'Alerta origen; NULL si la regla se eliminó.';
COMMENT ON COLUMN public.alert_firings.label IS 'Etiqueta legible (snapshot) del tipo de alerta.';
COMMENT ON COLUMN public.alert_firings.ticker IS 'Snapshot del ticker en el momento del disparo.';

CREATE INDEX IF NOT EXISTS alert_firings_user_sent_idx
    ON public.alert_firings (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS alert_firings_user_ticker_idx
    ON public.alert_firings (user_id, ticker);

CREATE INDEX IF NOT EXISTS alert_firings_alert_id_idx
    ON public.alert_firings (alert_id)
    WHERE alert_id IS NOT NULL;

ALTER TABLE public.alert_firings DISABLE ROW LEVEL SECURITY;

-- Panel: leer y borrar; INSERT solo vía worker (service_role).
GRANT SELECT, DELETE ON TABLE public.alert_firings TO anon;
GRANT SELECT, DELETE ON TABLE public.alert_firings TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.alert_firings TO service_role;
