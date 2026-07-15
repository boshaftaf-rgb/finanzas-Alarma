/** Rate limit en memoria para verificaciones manuales (no cuenta contra candle-lock). */

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

const lastVerifyByAlert = new Map<string, number>();

export function clearVerifyRateLimit(): void {
  lastVerifyByAlert.clear();
}

export function checkVerifyRateLimit(
  alertId: string,
  nowMs = Date.now(),
  cooldownMs = DEFAULT_COOLDOWN_MS,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const last = lastVerifyByAlert.get(alertId);
  if (last !== undefined) {
    const elapsed = nowMs - last;
    if (elapsed < cooldownMs) {
      return {
        ok: false,
        retryAfterSec: Math.ceil((cooldownMs - elapsed) / 1000),
      };
    }
  }
  return { ok: true };
}

export function markVerifySent(alertId: string, nowMs = Date.now()): void {
  lastVerifyByAlert.set(alertId, nowMs);
}

export const VERIFY_COOLDOWN_MS = DEFAULT_COOLDOWN_MS;
