-- Stoch presets ya documentados en ARCHITECTURE/PRD y usados por el panel;
-- el CHECK original solo permitía EMA/RSI/custom.

ALTER TABLE public.alerts
    DROP CONSTRAINT IF EXISTS alerts_preset_or_custom_valid;

ALTER TABLE public.alerts
    ADD CONSTRAINT alerts_preset_or_custom_valid CHECK (
        preset_or_custom IN (
            'ema_cross_bull',
            'ema_cross_bear',
            'golden_cross',
            'death_cross',
            'rsi_oversold',
            'rsi_overbought',
            'stoch_oversold',
            'stoch_overbought',
            'custom'
        )
    );
