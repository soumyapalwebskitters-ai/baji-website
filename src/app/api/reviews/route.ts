import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
// Explicit public projection: never expose the authentication ID or phone number.
const publicColumns = 'id, name, rating, quote, created_at, updated_at';
async function database() {
  if (process.env.NODE_ENV === 'development' && process.platform === 'darwin') {
    const { release } = await import('node:os');
    if (Number(release().split('.')[0]) < 22) {
      const { localReviewsDatabase } = await import('@/lib/reviews-local');
      return localReviewsDatabase();
    }
  }
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { REVIEWS_DB?: { prepare: (sql: string) => { bind: (...values: unknown[]) => { first: <T>() => Promise<T | null> }; all: <T>() => Promise<{ results: T[] }> } } }).REVIEWS_DB;
  if (!db) throw new Error('Reviews database is not configured');
  return db;
}
export async function GET() {
  try {
    const db = await database();
    const result = await db.prepare(`SELECT ${publicColumns} FROM reviews ORDER BY updated_at DESC, id DESC LIMIT 50`).all();
    return json({ reviews: result.results });
  } catch { return json({ error: 'Reviews are temporarily unavailable.' }, 503); }
}
export async function POST(request: Request) {
  const destination = new URL(request.url);
  const host = request.headers.get('host');
  if (host) destination.host = host;
  const origin = request.headers.get('origin');
  if (origin !== destination.origin && !(process.env.NEXT_PUBLIC_SITE_URL && origin === process.env.NEXT_PUBLIC_SITE_URL)) return json({ error: 'Please reload the page and try again.' }, 403);
  const token = (await cookies()).get('baji_customer_access')?.value;
  if (!token) return json({ error: 'Please sign in to write a review.' }, 401);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return json({ error: 'Customer login is temporarily unavailable.' }, 503);
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) return json({ error: response.status === 401 || response.status === 403 ? 'Please sign in again to submit your review.' : 'Unable to verify your account. Please try again.' }, response.status === 401 || response.status === 403 ? 401 : 503);
    const customer = await response.json();
    if (!customer.id || !customer.phone_confirmed_at || customer.is_anonymous) return json({ error: 'Verify your phone number before posting a review.' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid review.' }, 400); }
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const quote = typeof body?.quote === 'string' ? body.quote.trim() : '';
    const rating = body?.rating;
    if (name.length < 2 || name.length > 60 || quote.length < 10 || quote.length > 1500 || !Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Enter a name (2–60 characters), a rating (1–5), and a review (10–1500 characters).' }, 400);
    const db = await database();
    // One review per verified customer; resubmitting updates their existing story.
    const review = await db.prepare(`INSERT INTO reviews (id, customer_id, name, rating, quote) VALUES (?, ?, ?, ?, ?) ON CONFLICT(customer_id) DO UPDATE SET name = excluded.name, rating = excluded.rating, quote = excluded.quote, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') RETURNING ${publicColumns}`).bind(crypto.randomUUID(), customer.id, name, rating, quote).first();
    return json({ review });
  } catch { return json({ error: 'Unable to save your review. Please try again.' }, 503); }
}
