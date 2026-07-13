import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

let client = null;
let userId = null;

export function initFiringsApi(config) {
  if (!client) {
    client = createClient(config.supabaseUrl, config.anonKey);
  }
  userId = config.v1UserId;
}

export async function fetchFirings() {
  const { data, error } = await client
    .from("alert_firings")
    .select("*")
    .eq("user_id", userId)
    .order("ticker", { ascending: true })
    .order("sent_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteFiring(id) {
  const { error } = await client.from("alert_firings").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export function countFirings(firings) {
  return firings?.length ?? 0;
}

export function alertIdsWithFirings(firings) {
  const ids = new Set();
  for (const firing of firings ?? []) {
    if (firing.alert_id) ids.add(firing.alert_id);
  }
  return ids;
}
