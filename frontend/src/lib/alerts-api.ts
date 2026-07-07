import { V1_USER_ID } from "../config";
import { getSupabase } from "./supabase";
import type { Alert, CreateAlertInput } from "./types";

export async function fetchAlerts(): Promise<Alert[]> {
  const { data, error } = await getSupabase()
    .from("alerts")
    .select("*")
    .eq("user_id", V1_USER_ID)
    .order("ticker")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Alert[];
}

export async function createAlert(input: CreateAlertInput): Promise<Alert> {
  const { data, error } = await getSupabase()
    .from("alerts")
    .insert({
      user_id: V1_USER_ID,
      ticker: input.ticker,
      preset_or_custom: input.preset,
      params: {},
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Alert;
}

export async function setAlertActive(id: string, active: boolean): Promise<Alert> {
  const { data, error } = await getSupabase()
    .from("alerts")
    .update({ active })
    .eq("id", id)
    .eq("user_id", V1_USER_ID)
    .select()
    .single();

  if (error) throw error;
  return data as Alert;
}

export async function deleteAlert(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", V1_USER_ID);

  if (error) throw error;
}

export function countUniqueActiveTickers(alerts: Alert[]): number {
  const tickers = new Set(
    alerts.filter((a) => a.active).map((a) => a.ticker.toUpperCase()),
  );
  return tickers.size;
}
