import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Diagnóstico sin secretos — abre en el navegador. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    cron_secret_configured: Boolean(process.env.CRON_SECRET?.trim()),
    supabase_url_configured: Boolean(process.env.SUPABASE_URL?.trim()),
    supabase_service_role_configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    twelve_data_configured: Boolean(process.env.TWELVE_DATA_API_KEY?.trim()),
    smtp_user_configured: Boolean(process.env.SMTP_USER?.trim()),
    smtp_password_configured: Boolean(process.env.SMTP_APP_PASSWORD?.trim()),
    alert_recipient_configured: Boolean(process.env.ALERT_RECIPIENT_EMAIL?.trim()),
    worker_use_fixtures: process.env.WORKER_USE_FIXTURES === "true",
  });
}
