import { appendFileSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: alerts, error: e1 } = await sb
  .from("alerts")
  .select(
    "id,ticker,preset_or_custom,params,timeframe,last_triggered_candle,is_active,emails_sent_today,email_count_date",
  )
  .eq("ticker", "CIEN");

const { data: firings, error: e2 } = await sb
  .from("alert_firings")
  .select("*")
  .eq("ticker", "CIEN")
  .order("created_at", { ascending: false })
  .limit(30);

const payload = {
  sessionId: "af6ab3",
  hypothesisId: "D",
  location: "scripts/debug-cien-firings.mts",
  message: "CIEN alerts and firings from Supabase",
  data: { e1: e1?.message ?? null, e2: e2?.message ?? null, alerts, firings },
  timestamp: Date.now(),
  runId: "pre-fix",
};
appendFileSync("debug-af6ab3.log", `${JSON.stringify(payload)}\n`);
console.log(JSON.stringify(payload, null, 2));
