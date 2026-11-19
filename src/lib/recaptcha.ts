export function validRecaptcha(result: unknown, hostname: string, now = Date.now()): boolean {
  if (!result || typeof result !== 'object') return false;
  const value = result as Record<string, unknown>;
  const timestamp = typeof value.challenge_ts === 'string' ? Date.parse(value.challenge_ts) : NaN;
  return value.success === true && value.action === 'place_order'
    && typeof value.score === 'number' && value.score >= 0.5 && value.score <= 1
    && value.hostname === hostname && Number.isFinite(timestamp)
    && now - timestamp >= -30000 && now - timestamp <= 120000;
}
