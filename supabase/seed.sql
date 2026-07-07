-- Seed de alertas de ejemplo para v1 (un solo usuario — papá)
-- Ejecutar después de aplicar migraciones.
-- user_id fijo: 00000000-0000-0000-0000-000000000001 (hasta auth en issue #3)

DELETE FROM public.alerts
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO public.alerts (user_id, ticker, preset_or_custom, params, active)
VALUES
    (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'AAPL',
        'ema_cross_bull',
        '{}'::jsonb,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'MSFT',
        'rsi_oversold',
        '{}'::jsonb,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'NVDA',
        'golden_cross',
        '{}'::jsonb,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'TSLA',
        'rsi_overbought',
        '{}'::jsonb,
        false
    );
