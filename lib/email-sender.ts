import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { buildAlertEmail, buildVerifyAlertEmail } from "./alert-email-template.js";
import type { AlertSnapshot } from "./alert-snapshot.js";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  recipient: string;
}

export function smtpConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SmtpConfig {
  const host = env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(env.SMTP_PORT ?? "587");
  const user = env.SMTP_USER?.trim() ?? "";
  const password = (env.SMTP_APP_PASSWORD ?? "").replace(/\s+/g, "");
  const recipient = env.ALERT_RECIPIENT_EMAIL?.trim() ?? "";

  if (!user || !password || !recipient) {
    throw new Error("Faltan SMTP_USER, SMTP_APP_PASSWORD o ALERT_RECIPIENT_EMAIL");
  }

  return { host, port, user, password, recipient };
}

export function createTransport(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

export async function sendAlertEmail(
  params: {
    config: SmtpConfig;
    ticker: string;
    presetOrCustom: string;
    candleTimestamp: string;
    alertParams?: Record<string, unknown>;
    timeframe?: string | null;
    transport?: Transporter;
  },
): Promise<void> {
  const { subject, text } = buildAlertEmail({
    ticker: params.ticker,
    presetOrCustom: params.presetOrCustom,
    candleTimestamp: params.candleTimestamp,
    alertParams: params.alertParams,
    timeframe: params.timeframe,
  });

  const transport = params.transport ?? createTransport(params.config);
  await transport.sendMail({
    from: params.config.user,
    to: params.config.recipient,
    subject,
    text,
  });
}

export async function sendVerifyAlertEmail(params: {
  config: SmtpConfig;
  snapshot: AlertSnapshot;
  transport?: Transporter;
}): Promise<void> {
  const { subject, text } = buildVerifyAlertEmail({
    ticker: params.snapshot.ticker,
    presetOrCustom: params.snapshot.presetOrCustom,
    candleTimestamp: params.snapshot.candleTimestamp,
    alertParams: params.snapshot.alertParams,
    timeframe: params.snapshot.timeframe,
    close: params.snapshot.close,
    valueLines: params.snapshot.valueLines,
    conditionMet: params.snapshot.conditionMet,
  });

  const transport = params.transport ?? createTransport(params.config);
  await transport.sendMail({
    from: params.config.user,
    to: params.config.recipient,
    subject,
    text,
  });
}
