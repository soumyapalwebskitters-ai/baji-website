import { getCatalog } from '@/lib/catalog';
import { whatsappMessage, whatsappNumber, type CartLine } from '@/lib/commerce';
import { validRecaptcha } from '@/lib/recaptcha';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); }
  catch { return fail('Invalid order request.', 400); }
  if (!body || typeof body.token !== 'string' || !body.token || body.token.length > 10000) {
    return fail('Please retry the security check.', 400);
  }
  if (!Array.isArray(body.cart) || !body.cart.length || body.cart.length > 200 || body.cart.some((line: CartLine) => !line || typeof line.variantId !== 'string' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99)) {
    return fail('Please review the items in your bag.', 400);
  }
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return fail('reCAPTCHA is unavailable. Your order has not been submitted. Please try again later.', 503);
  try {
    const verification = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret, response: body.token }),
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) return fail('Security check unavailable. Please try again.', 503);
    const hostname = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).hostname;
    // Development requests must match the actual local hostname.
    const expectedHostname = process.env.NODE_ENV === 'development' ? new URL(request.url).hostname : hostname;
    if (!validRecaptcha(await verification.json(), expectedHostname)) {
      return fail('reCAPTCHA verification failed. Your order has not been submitted. Please try again.', 403);
    }
    const catalog = await getCatalog();
    const number = whatsappNumber(catalog.seller.whatsapp);
    if (!number) return fail('WhatsApp ordering is temporarily unavailable. Your bag is still here.', 503);
    let message;
    try { message = whatsappMessage(catalog, body.cart); }
    catch { return fail('A cart item is no longer available. Please refresh the page and review your bag.', 400); }
    return Response.json({ catalog, checkout: `https://wa.me/${number}?text=${encodeURIComponent(message)}` }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return fail('Unable to check your order. Please try again.', 503); }
}
