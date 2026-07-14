-- Orden personalizado de grupos de ticker en el panel de alertas.
-- Ver docs/ARCHITECTURE.md

CREATE TABLE IF NOT EXISTS public.user_ticker_order (
    user_id UUID NOT NULL,
    ticker TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    CONSTRAINT user_ticker_order_pkey PRIMARY KEY (user_id, ticker),
    CONSTRAINT user_ticker_order_ticker_format CHECK (ticker ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
    CONSTRAINT user_ticker_order_sort_nonneg CHECK (sort_order >= 0)
);

COMMENT ON TABLE public.user_ticker_order IS 'Orden de grupos de ticker en el listado de alertas del panel.';
COMMENT ON COLUMN public.user_ticker_order.sort_order IS 'Posición 0-based; menor = más arriba en el listado.';

CREATE INDEX IF NOT EXISTS user_ticker_order_user_sort_idx
    ON public.user_ticker_order (user_id, sort_order);

-- v1 sin auth: mismo patrón que alerts / alert_firings
ALTER TABLE public.user_ticker_order DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ticker_order TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ticker_order TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ticker_order TO service_role;
