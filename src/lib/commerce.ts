export type Variant = { id: string; name: string; sku: string; image: string; price: number | null; itemsPerBox: number; sellingUnit: 'box' | 'item' };
export type Product = { id: string; name: string; image: string; variants: Variant[] };
export type Catalog = { products: Product[]; seller: { email: string; phone: string; address: string; whatsapp: string } };
export type CartLine = { variantId: string; quantity: number };
export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
export const unitPrice = (variant: Variant) => variant.price === null ? null : Math.round(variant.price * (variant.sellingUnit === 'box' ? variant.itemsPerBox : 1) * 100) / 100;
export function whatsappNumber(value: string) {
  const cleaned = value.replace(/[\s()+-]/g, '');
  return /^[1-9]\d{7,14}$/.test(cleaned) ? cleaned : '';
}
export function resolveCart(catalog: Catalog, cart: CartLine[]) {
  return cart.map((line) => {
    const product = catalog.products.find((p) => p.variants.some((v) => v.id === line.variantId));
    const variant = product?.variants.find((v) => v.id === line.variantId);
    const price = variant ? unitPrice(variant) : null;
    if (!product || !variant || price === null || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error('A cart item is no longer available. Please remove it and choose again.');
    return { ...line, product, variant, price, total: Math.round(price * line.quantity * 100) / 100 };
  });
}
export function whatsappMessage(catalog: Catalog, cart: CartLine[]) {
  const lines = resolveCart(catalog, cart);
  const total = lines.reduce((sum, line) => sum + Math.round(line.total * 100), 0) / 100;
  return ['Hello Baji Market! I would like to order:', '', ...lines.map((line, index) => `${index + 1}. ${line.product.name} — ${line.variant.name}${line.variant.sku ? ` [${line.variant.sku}]` : ''}\n   ${line.quantity} ${line.variant.sellingUnit === 'box' ? `box(es), ${line.variant.itemsPerBox} pieces per box` : 'piece(s)'} × ${money(line.price)} = ${money(line.total)}`), '', `Estimated total: ${money(total)}`, '', 'Please confirm availability, final pricing and collection/delivery arrangements.'].join('\n');
}
