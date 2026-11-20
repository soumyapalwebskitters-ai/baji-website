import { getCloudflareContext } from '@opennextjs/cloudflare';

export type CustomerProfile = { name: string; phone: string; email: string; location: string };
type Database = { prepare: (sql: string) => { bind: (...values: unknown[]) => { first: <T>() => Promise<T | null> } } };
async function database(): Promise<Database> {
  if (process.env.NODE_ENV === 'development' && process.platform === 'darwin') {
    const { release } = await import('node:os');
    if (Number(release().split('.')[0]) < 22) {
      const { localReviewsDatabase } = await import('./reviews-local');
      return localReviewsDatabase();
    }
  }
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { REVIEWS_DB?: Database }).REVIEWS_DB;
  if (!db) throw new Error('Customer database is not configured.');
  return db;
}
export function parseCustomerProfile(input: Record<string, unknown>): CustomerProfile {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const location = typeof input.location === 'string' ? input.location.trim() : '';
  if (name.length < 2 || name.length > 80) throw new Error('Enter your name (2–80 characters).');
  if (!/^\+91\d{10}$/.test(phone)) throw new Error('Enter your 10-digit phone number with +91.');
  if (input.email !== undefined && typeof input.email !== 'string' || email.length > 254 || email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address or leave it blank.');
  if (input.location !== undefined && typeof input.location !== 'string' || location.length > 200) throw new Error('Location must be 200 characters or fewer.');
  return { name, phone, email, location };
}
export async function saveCustomerProfile(customerId: string, profile: CustomerProfile) {
  const db = await database();
  const saved = await db.prepare(`INSERT INTO customer_profiles (customer_id, name, phone, email, location) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(customer_id) DO UPDATE SET name=excluded.name, phone=excluded.phone, email=excluded.email, location=excluded.location,
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now') RETURNING name, phone, email, location`)
    .bind(customerId, profile.name, profile.phone, profile.email, profile.location).first<CustomerProfile>();
  if (!saved) throw new Error('Profile was not saved.');
  return saved;
}
export async function loadCustomerProfile(customerId: string) {
  const db = await database();
  return db.prepare('SELECT name, phone, email, location FROM customer_profiles WHERE customer_id = ?').bind(customerId).first<CustomerProfile>();
}
