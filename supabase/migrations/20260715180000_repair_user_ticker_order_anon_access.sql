-- Repair v1: el panel usa anon; RLS activo bloquea INSERT/UPDATE del orden
-- ("new row violates row-level security policy for table user_ticker_order").
-- Mismo patrón que alert_firings (20260713190000) y alerts (20260307140000).

ALTER TABLE public.user_ticker_order DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ticker_order TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ticker_order TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_ticker_order TO service_role;
