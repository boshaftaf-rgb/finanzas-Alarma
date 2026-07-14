import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

let client = null;
let userId = null;

export function initTickerOrderApi(config) {
  client = createClient(config.supabaseUrl, config.anonKey);
  userId = config.v1UserId;
}

/** @returns {Promise<string[]>} tickers ordered by sort_order ascending */
export async function fetchTickerOrder() {
  const { data, error } = await client
    .from("user_ticker_order")
    .select("ticker, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => String(row.ticker).toUpperCase());
}

/**
 * Persist full ticker order as 0-based sort_order values.
 * @param {string[]} tickers
 */
export async function saveTickerOrder(tickers) {
  const rows = tickers.map((ticker, sort_order) => ({
    user_id: userId,
    ticker: String(ticker).toUpperCase(),
    sort_order,
  }));

  if (rows.length === 0) return;

  const { error } = await client.from("user_ticker_order").upsert(rows, {
    onConflict: "user_id,ticker",
  });

  if (error) throw error;
}

/** Remove order row when the user no longer has alerts for that ticker. */
export async function deleteTickerOrder(ticker) {
  const { error } = await client
    .from("user_ticker_order")
    .delete()
    .eq("user_id", userId)
    .eq("ticker", String(ticker).toUpperCase());

  if (error) throw error;
}
