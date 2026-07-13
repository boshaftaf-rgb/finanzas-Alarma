-- Repair v1: el panel usa anon; RLS activo oculta todos los disparos (0 filas).
-- Mismo patrón que alerts (20260307140000_v1_panel_anon_grants).

ALTER TABLE public.alert_firings DISABLE ROW LEVEL SECURITY;

GRANT SELECT, DELETE ON TABLE public.alert_firings TO anon;
GRANT SELECT, DELETE ON TABLE public.alert_firings TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.alert_firings TO service_role;
