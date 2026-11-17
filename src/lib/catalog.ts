import 'server-only';
import { cache } from 'react';
import type { Catalog } from './commerce';

export const catalogOrigin = process.env.CATALOG_API_URL || 'https://market.soumya-pal-webskitters.workers.dev';
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function image(value: unknown): string {
  const source = text(value);
  if (/^data:image\/(jpeg|png|webp);base64,/.test(source)) return source;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (['drive.google.com', 'drive.usercontent.google.com'].includes(url.hostname)) return `/api/product-image?url=${encodeURIComponent(source)}`;
    return source;
  } catch { return ''; }
}
export const getCatalog = cache(async (): Promise<Catalog> => {
  // Deliberately omit cookies and authorization: the existing Worker returns only its public D1 projection.
  const response = await fetch(`${catalogOrigin}/api/state`, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Catalogue unavailable');
  const payload = await response.json();
  if (payload.staff !== false || !Array.isArray(payload.state?.products)) throw new Error('Unexpected catalogue response');
  const seller = payload.state.seller || {};
  return {
    products: payload.state.products.map((p: Record<string, unknown>) => ({
      id: text(p.id), name: text(p.name), image: image(p.image),
      variants: (Array.isArray(p.variants) ? p.variants : []).map((v: Record<string, unknown>) => ({
        id: text(v.id), name: text(v.name), sku: text(v.sku), image: image(v.image),
        price: typeof v.price === 'number' && Number.isFinite(v.price) && v.price >= 0 ? v.price : null,
        itemsPerBox: typeof v.itemsPerBox === 'number' && Number.isInteger(v.itemsPerBox) && v.itemsPerBox > 0 ? v.itemsPerBox : 1,
        sellingUnit: v.sellingUnit === 'box' ? 'box' as const : 'item' as const,
      })),
    })),
    seller: { email: text(seller.email), phone: text(seller.phone), address: text(seller.address), whatsapp: text(process.env.SHOP_WHATSAPP || seller.whatsapp) },
  };
});
