import { getCatalog } from '@/lib/catalog';
import { resolveCart, type CartLine } from '@/lib/commerce';
import { parseCustomerProfile } from '@/lib/customer-profiles';
import { findProductQuery, saveProductQuery, type QueryReceipt } from '@/lib/product-queries';
import { recaptchaFailure } from '@/lib/recaptcha';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const fail = (error: string, status: number) => json({ error }, status);
const receipt = (saved: QueryReceipt) => json({ queryId: saved.id, message: 'we will contact you soon' });
export async function POST(request: Request) {
  const destination = new URL(request.url);
  if (request.headers.get('host')) destination.host = request.headers.get('host')!;
  const origin = request.headers.get('origin');
  if (origin !== destination.origin && !(process.env.NEXT_PUBLIC_SITE_URL && origin === process.env.NEXT_PUBLIC_SITE_URL)) return fail('Please reload the page and try again.', 403);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 50000) return fail('Query is too large.', 413);
    body = JSON.parse(raw);
  } catch { return fail('Invalid product query.', 400); }
  if (!body || typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) return fail('Please refresh and try again.', 400);
  if (typeof body.token !== 'string' || !body.token || body.token.length > 10000) return fail('Please retry the security check.', 400);
  if (!Array.isArray(body.cart) || !body.cart.length || body.cart.length > 200 || body.cart.some((line: CartLine) => !line || typeof line.variantId !== 'string' || !line.variantId || line.variantId.length > 200 || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) || new Set(body.cart.map((line: CartLine) => line.variantId)).size !== body.cart.length) return fail('Please review the items in your bag.', 400);
  let contact;
  try { contact = parseCustomerProfile(body.contact || {}); } catch (error) { return fail(error instanceof Error ? error.message : 'Check your contact details.', 400); }
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return fail('Security check is unavailable. Please try again later.', 503);
  try {
    const verification = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret, response: body.token }), cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) return fail('Security check is unavailable. Please try again.', 503);
    const hostname = process.env.NODE_ENV === 'development' ? destination.hostname : new URL(process.env.NEXT_PUBLIC_SITE_URL || destination).hostname;
    const verificationResult = await verification.json();
    const reason = recaptchaFailure(verificationResult, hostname, Date.now(), 'place_query');
    if (reason) {
      const reference = crypto.randomUUID();
      // Never log the token, secret, contact details or cart.
      console.warn('product-query-recaptcha', JSON.stringify({ reference, reason }));
      const message = reason === 'expired-token'
        ? 'The security check expired. Please click Place query again.'
        : reason === 'low-score'
          ? 'Google could not verify this browser. Please reload and try again.'
          : reason === 'configuration' || reason === 'hostname-mismatch' || reason === 'action-mismatch'
            ? 'The website security check needs attention. Please try again later.'
            : 'The security check was rejected. Please reload and try again.';
      return json({ error: message, code: `recaptcha-${reason}`, reference }, reason === 'configuration' ? 503 : 403);
    }
    const cart = body.cart.map((line: CartLine) => ({ variantId: line.variantId, quantity: line.quantity })).sort((a: CartLine, b: CartLine) => a.variantId.localeCompare(b.variantId));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ contact, cart })));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const existing = await findProductQuery(body.id);
    if (existing) return existing.request_hash === hash ? receipt(existing) : fail('This submission reference was already used. Please refresh and try again.', 409);
    const catalog = await getCatalog();
    let lines;
    try { lines = resolveCart(catalog, cart); } catch { return fail('An item is no longer available. Please update your bag and try again.', 400); }
    const items = lines.map(line => ({ productId: line.product.id, productName: line.product.name, variantId: line.variant.id, variantName: line.variant.name, sku: line.variant.sku, quantity: line.quantity, sellingUnit: line.variant.sellingUnit, itemsPerBox: line.variant.itemsPerBox, unitPriceMinor: Math.round(line.price * 100), totalMinor: Math.round(line.total * 100) }));
    const total = items.reduce((sum, item) => sum + item.totalMinor, 0);
    if (!Number.isSafeInteger(total) || total < 0) return fail('Unable to calculate the total. Please try again.', 400);
    const saved = await saveProductQuery(body.id, hash, contact, items, total);
    if (!saved) throw new Error('Query was not saved');
    return saved.request_hash === hash ? receipt(saved) : fail('This submission reference was already used. Please refresh and try again.', 409);
  } catch { return fail('Unable to save your query. Please try again.', 503); }
}
