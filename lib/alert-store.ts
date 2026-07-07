import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AlertRow } from "./types.js";
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
}
