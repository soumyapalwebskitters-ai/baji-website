import { cookies } from 'next/headers';

const accessCookie = 'baji_customer_access';
const refreshCookie = 'baji_customer_refresh';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  // Next.js may construct request.url with localhost even for LAN requests.
  // The browser's Host header retains the actual destination, including its port.
  const destination = new URL(request.url);
  const host = request.headers.get('host');
  if (host) destination.host = host;
  const origin = request.headers.get('origin');
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const sameOrigin = origin === destination.origin || (Boolean(configuredOrigin) && origin === configuredOrigin);
  if (!sameOrigin) return json({ error: 'Please reload this page and try again.' }, 403);
  const store = await cookies();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (!body || !['send', 'verify', 'session', 'logout'].includes(body.action)) return json({ error: 'Invalid action.' }, 400);
  if (!url || !key) return json({ error: 'Phone login is not available yet. Please continue shopping as a guest.' }, 503);
  const auth = (path: string, data?: unknown, token?: string) => fetch(`${url.replace(/\/$/, '')}/auth/v1/${path}`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }), cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const save = (session: { access_token: string; refresh_token: string; expires_in: number }) => {
    const options = { httpOnly: true, secure: origin?.startsWith('https://') === true, sameSite: 'lax' as const, path: '/' };
    store.set(accessCookie, session.access_token, { ...options, maxAge: session.expires_in || 3600 });
    store.set(refreshCookie, session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
  };
  const clear = () => { store.delete(accessCookie); store.delete(refreshCookie); };
  try {
    if (body.action === 'logout') {
      const token = store.get(accessCookie)?.value;
      if (token) await auth('logout?scope=local', {}, token).catch(() => null);
      clear(); return json({ user: null });
    }
    if (body.action === 'session') {
      let token = store.get(accessCookie)?.value;
      if (token) {
        const response = await auth('user', undefined, token);
        if (response.ok) { const user = await response.json(); return json({ user: { phone: user.phone } }); }
        if (response.status !== 401 && response.status !== 403) return json({ error: 'Unable to check your account. Try again.' }, 503);
      }
      const refresh = store.get(refreshCookie)?.value;
      if (!refresh) { clear(); return json({ user: null }); }
      const response = await auth('token?grant_type=refresh_token', { refresh_token: refresh });
      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) return json({ error: 'Unable to check your account. Try again.' }, 503);
        clear(); return json({ user: null });
      }
      const session = await response.json(); save(session);
      return json({ user: { phone: session.user.phone } });
    }
    if (typeof body.phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(body.phone)) return json({ error: 'Enter your phone number with country code, for example +91.' }, 400);
    if (body.action === 'verify' && (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code))) return json({ error: 'Enter the six-digit verification code.' }, 400);
    const response = await auth(body.action === 'send' ? 'otp' : 'verify', body.action === 'send' ? { phone: body.phone, create_user: true, channel: 'sms' } : { phone: body.phone, token: body.code, type: 'sms' });
    if (!response.ok) return json({ error: response.status === 429 ? 'Too many attempts. Please wait before trying again.' : body.action === 'send' ? 'We could not send a code. Please try again later.' : 'The code is invalid or expired. Please try again.' }, response.status === 429 ? 429 : 400);
    if (body.action === 'send') return json({ sent: true });
    const session = await response.json();
    if (!session.access_token || !session.refresh_token || !session.user?.phone) return json({ error: 'Unable to verify your account.' }, 502);
    save(session); return json({ user: { phone: session.user.phone } });
  } catch { return json({ error: 'Phone login is temporarily unavailable. Please try again.' }, 503); }
}
