import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

let client = null;
let userId = null;

export function initAlertsApi(config) {
  client = createClient(config.supabaseUrl, config.anonKey);
  userId = config.v1UserId;
}

export async function fetchAlerts() {
  const { data, error } = await client
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("ticker")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAlert({ ticker, presetOrCustom, params = {}, timeframe = "15min" }) {
  const { data, error } = await client
    .from("alerts")
    .insert({
      user_id: userId,
      ticker,
      preset_or_custom: presetOrCustom,
      params,
      timeframe,
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlert(id, { presetOrCustom, params = {}, timeframe }) {
  const payload = {
    preset_or_custom: presetOrCustom,
    params,
  };
  if (timeframe !== undefined) {
    payload.timeframe = timeframe;
  }

  const { data, error } = await client
    .from("alerts")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setAlertActive(id, active) {
  const { data, error } = await client
    .from("alerts")
    .update({ active })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAlert(id) {
  const { error } = await client.from("alerts").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export function countUniqueActiveTickers(alerts) {
  const tickers = new Set(alerts.filter((a) => a.active).map((a) => a.ticker.toUpperCase()));
  return tickers.size;
}
