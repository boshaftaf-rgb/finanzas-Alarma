import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Config pública del panel (solo URL + anon key; sin secretos del worker). */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim() || "";
  const v1UserId =
    process.env.VITE_V1_USER_ID?.trim() || "00000000-0000-0000-0000-000000000001";

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({
      error: "Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.",
    });
  }

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ supabaseUrl, anonKey, v1UserId });
}
