export function recaptchaFailure(result: unknown, hostname: string, now = Date.now(), action = 'place_order'): string | null {
  if (!result || typeof result !== 'object') return 'invalid-response';
  const value = result as Record<string, unknown>;
  const codes = Array.isArray(value['error-codes']) ? value['error-codes'] : [];
  if (codes.includes('invalid-input-secret') || codes.includes('missing-input-secret')) return 'configuration';
  if (codes.includes('timeout-or-duplicate')) return 'expired-token';
  if (value.success !== true) return 'token-rejected';
  if (value.action !== action) return 'action-mismatch';
  if (value.hostname !== hostname) return 'hostname-mismatch';
  if (typeof value.score !== 'number' || !Number.isFinite(value.score) || value.score > 1 || value.score < 0) return 'invalid-score';
  if (value.score < 0.5) return 'low-score';
  const timestamp = typeof value.challenge_ts === 'string' ? Date.parse(value.challenge_ts) : NaN;
  if (!Number.isFinite(timestamp)) return 'invalid-timestamp';
  if (now - timestamp < -30000 || now - timestamp > 120000) return 'expired-token';
  return null;
}

export function validRecaptcha(result: unknown, hostname: string, now = Date.now(), action = 'place_order'): boolean {
  return recaptchaFailure(result, hostname, now, action) === null;
}
