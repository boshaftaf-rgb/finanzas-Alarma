import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AlertRow } from "./types.js";

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
}
