-- Tabla alerts (v1 sin auth — user_id es placeholder hasta issue #3)
-- Ver docs/ARCHITECTURE.md y docs/PRD.md

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ticker TEXT NOT NULL,
    preset_or_custom TEXT NOT NULL,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    emails_sent_today INTEGER NOT NULL DEFAULT 0,
    email_count_date DATE,
    last_triggered_candle TIMESTAMPTZ,
    last_evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT alerts_ticker_format CHECK (ticker ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
    CONSTRAINT alerts_preset_or_custom_valid CHECK (
        preset_or_custom IN (
            'ema_cross_bull',
            'ema_cross_bear',
            'golden_cross',
            'death_cross',
            'rsi_oversold',
            'rsi_overbought',
            'custom'
        )
    ),
    CONSTRAINT alerts_emails_sent_today_range CHECK (
        emails_sent_today >= 0 AND emails_sent_today <= 10
    )
);

COMMENT ON TABLE public.alerts IS 'Alertas técnicas por ticker; evaluadas por el worker.';
COMMENT ON COLUMN public.alerts.user_id IS 'Propietario; en v1 un único UUID fijo (papá) hasta auth.';
COMMENT ON COLUMN public.alerts.preset_or_custom IS 'ID de preset o custom.';
COMMENT ON COLUMN public.alerts.params IS 'Parámetros JSON para alertas custom; {} en presets.';
COMMENT ON COLUMN public.alerts.email_count_date IS 'Fecha (DATE) del contador diario de emails.';
COMMENT ON COLUMN public.alerts.last_triggered_candle IS 'Candle-lock: vela que disparó el último email.';

CREATE INDEX IF NOT EXISTS alerts_active_idx ON public.alerts (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS alerts_user_ticker_active_idx
    ON public.alerts (user_id, ticker)
    WHERE active = true;

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alerts_set_updated_at ON public.alerts;
CREATE TRIGGER alerts_set_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Límite: máx. 5 alertas activas por (user_id, ticker)
CREATE OR REPLACE FUNCTION public.enforce_max_alerts_per_ticker()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    active_count INTEGER;
BEGIN
    IF NEW.active IS DISTINCT FROM true THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*)
    INTO active_count
    FROM public.alerts
    WHERE user_id = NEW.user_id
      AND ticker = NEW.ticker
      AND active = true
      AND id IS DISTINCT FROM NEW.id;

    IF active_count >= 5 THEN
        RAISE EXCEPTION 'Límite de 5 alertas activas por ticker (%).', NEW.ticker
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alerts_max_per_ticker ON public.alerts;
CREATE TRIGGER alerts_max_per_ticker
    BEFORE INSERT OR UPDATE OF active, ticker, user_id ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_max_alerts_per_ticker();

-- Límite: máx. 15 tickers únicos activos por user_id
CREATE OR REPLACE FUNCTION public.enforce_max_unique_tickers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    unique_count INTEGER;
    ticker_already_active BOOLEAN;
BEGIN
    IF NEW.active IS DISTINCT FROM true THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.alerts
        WHERE user_id = NEW.user_id
          AND ticker = NEW.ticker
          AND active = true
          AND id IS DISTINCT FROM NEW.id
    )
    INTO ticker_already_active;

    IF ticker_already_active THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(DISTINCT ticker)
    INTO unique_count
    FROM public.alerts
    WHERE user_id = NEW.user_id
      AND active = true
      AND id IS DISTINCT FROM NEW.id;

    IF unique_count >= 15 THEN
        RAISE EXCEPTION 'Límite de 15 tickers únicos activos por usuario.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alerts_max_unique_tickers ON public.alerts;
CREATE TRIGGER alerts_max_unique_tickers
    BEFORE INSERT OR UPDATE OF active, ticker, user_id ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_max_unique_tickers();

-- v1 sin auth: sin RLS (acceso vía service_role y seed SQL manual)
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
