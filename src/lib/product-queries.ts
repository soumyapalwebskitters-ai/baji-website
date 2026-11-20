import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { CustomerProfile } from './customer-profiles';
export type QueryReceipt = { id: string; request_hash: string; estimated_total_minor: number; created_at: string };
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
  if (!db) throw new Error('Query database unavailable');
  return db;
}
export async function findProductQuery(id: string) {
  return (await database()).prepare('SELECT id, request_hash, estimated_total_minor, created_at FROM "product query" WHERE id=?').bind(id).first<QueryReceipt>();
}
export async function saveProductQuery(id: string, hash: string, contact: CustomerProfile, items: unknown[], total: number) {
  const db = await database();
  const saved = await db.prepare(`INSERT INTO "product query" (id, request_hash, name, phone, email, location, items_json, estimated_total_minor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING RETURNING id, request_hash, estimated_total_minor, created_at`)
    .bind(id, hash, contact.name, contact.phone, contact.email, contact.location, JSON.stringify(items), total).first<QueryReceipt>();
  return saved || findProductQuery(id);
}
