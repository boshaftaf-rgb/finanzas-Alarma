import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AlertFiringInsert, AlertRow } from "./types.js";
import { effectiveDailyCount } from "./alert-fire-policy.js";

export class AlertStore {
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey);
  }

  async fetchActiveAlerts(): Promise<AlertRow[]> {
    const { data, error } = await this.client
      .from("alerts")
      .select("*")
      .eq("active", true)
      .order("ticker");

    if (error) throw new Error(`Error leyendo alertas: ${error.message}`);
    return (data ?? []) as AlertRow[];
  }

  async updateLastEvaluated(alertId: string, evaluatedAt = new Date()): Promise<void> {
    const { error } = await this.client
      .from("alerts")
      .update({ last_evaluated_at: evaluatedAt.toISOString() })
      .eq("id", alertId);

    if (error) throw new Error(`Error actualizando alerta ${alertId}: ${error.message}`);
  }

  async recordEmailSent(
    alert: AlertRow,
    candleTimestamp: string,
    today: string,
    evaluatedAt = new Date(),
  ): Promise<void> {
    const emailsSentToday = effectiveDailyCount(alert, today) + 1;
    const { error } = await this.client
      .from("alerts")
      .update({
        last_triggered_candle: candleTimestamp,
        emails_sent_today: emailsSentToday,
        email_count_date: today,
        last_evaluated_at: evaluatedAt.toISOString(),
      })
      .eq("id", alert.id);

    if (error) throw new Error(`Error registrando disparo ${alert.id}: ${error.message}`);
  }

  async insertAlertFiring(firing: AlertFiringInsert): Promise<void> {
    const { error } = await this.client.from("alert_firings").insert({
      user_id: firing.user_id,
      alert_id: firing.alert_id,
      ticker: firing.ticker,
      preset_or_custom: firing.preset_or_custom,
      params: firing.params,
      timeframe: firing.timeframe,
      candle_timestamp: firing.candle_timestamp,
      label: firing.label,
      ...(firing.sent_at ? { sent_at: firing.sent_at } : {}),
    });

    if (error) throw new Error(`Error insertando disparo UI: ${error.message}`);
  }
}
