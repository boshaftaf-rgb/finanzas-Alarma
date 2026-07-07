-- v1 sin auth: panel React usa clave anon (issue #4 Fase 3a)
-- RLS desactivado; grants explícitos para rol anon.

ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.alerts TO authenticated;
