import test from 'node:test';
import assert from 'node:assert/strict';
import { unitPrice, resolveCart, whatsappMessage, whatsappNumber } from '../src/lib/commerce.ts';
const piece = { id: 'piece', name: 'Loose', sku: 'P1', image: '', price: 2.5, itemsPerBox: 10, sellingUnit: 'item' };
const box = { ...piece, id: 'box', name: 'Box', sellingUnit: 'box' };
const catalog = { products: [{ id: 'p', name: 'Sparklers', image: '', variants: [piece, box] }], seller: { whatsapp: '919876543210' } };
test('piece price remains per piece; box price includes its pack size', () => { assert.equal(unitPrice(piece), 2.5); assert.equal(unitPrice(box), 25); });
test('decimal totals avoid floating point artefacts', () => { assert.equal(unitPrice({ ...box, price: 4.4, itemsPerBox: 50 }), 220); });
test('cart and WhatsApp message use current catalogue prices and correct quantities', () => {
  const cart = [{ variantId: 'box', quantity: 2 }, { variantId: 'piece', quantity: 3 }];
  assert.equal(resolveCart(catalog, cart).reduce((sum, line) => sum + line.total, 0), 57.5);
  const message = whatsappMessage(catalog, cart);
  assert.match(message, /2 box\(es\), 10 pieces per box/);
  assert.match(message, /57\.50/);
  assert.match(message, /Please confirm availability/);
  assert.equal(resolveCart({ ...catalog, products: [{ ...catalog.products[0], variants: [{ ...box, price: 3 }] }] }, [cart[0]])[0].total, 60);
});
test('invalid quantities, deleted variants and unavailable prices cannot be checked out', () => {
  for (const quantity of [0, -1, 1.5, 100, NaN]) assert.throws(() => resolveCart(catalog, [{ variantId: 'box', quantity }]));
  assert.throws(() => resolveCart(catalog, [{ variantId: 'missing', quantity: 1 }]));
  assert.equal(unitPrice({ ...piece, price: null }), null);
});
test('WhatsApp numbers accept formatting but reject URLs and invalid input', () => {
  assert.equal(whatsappNumber('+91 98765 43210'), '919876543210');
  assert.equal(whatsappNumber('https://wa.me/123'), '');
  assert.equal(whatsappNumber(''), '');
});
