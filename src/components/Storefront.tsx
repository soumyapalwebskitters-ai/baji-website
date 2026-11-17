'use client';
import { useState } from 'react';
import { money, resolveCart, unitPrice, whatsappMessage, whatsappNumber, type CartLine, type Catalog, type Product } from '@/lib/commerce';

function ProductCard({ product, index, add }: { product: Product; index: number; add: (id: string) => void }) {
  const [selected, setSelected] = useState(product.variants[0]?.id || '');
  const [failed, setFailed] = useState('');
  const variant = product.variants.find((v) => v.id === selected) || product.variants[0];
  if (!variant) return null;
  const source = variant.image || product.image;
  const price = unitPrice(variant);
  return <article className="product">
    <div className={`product-visual real-product ${['peach', 'sage', 'lavender'][index % 3]}`}><span className="product-category">{variant.sellingUnit === 'box' ? 'By the box' : 'By the piece'}</span><span className="product-number">/{String(index + 1).padStart(2, '0')}</span>
      {source && failed !== source ? <img src={source} onError={() => setFailed(source)} alt={`${product.name} — ${variant.name}`} width="480" height="420" loading="lazy" /> : <div className="image-placeholder"><span aria-hidden="true">✳</span><p>{product.name}</p><small>Photo coming soon</small></div>}
      <span className="product-sizes">{variant.itemsPerBox} {variant.itemsPerBox === 1 ? 'piece' : 'pieces'} per box</span>
    </div>
    <div className="product-info"><h3>{product.name}</h3><strong>{price === null ? 'Enquire' : money(price)}<small> / {variant.sellingUnit === 'box' ? 'box' : 'piece'}</small></strong></div>
    <label className="variant-label">Choose a variant<select aria-label={`Variant for ${product.name}`} value={variant.id} onChange={(e) => setSelected(e.target.value)}>{product.variants.map((v) => <option value={v.id} key={v.id}>{v.name}</option>)}</select></label>
    <button type="button" className="button add-cart" disabled={price === null} onClick={() => add(variant.id)}>Add to bag <span aria-hidden="true">+</span></button>
  </article>;
}
export default function Storefront({ initialCatalog }: { initialCatalog: Catalog | null }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState('');
  const [error, setError] = useState('');
  const products = catalog?.products.filter((p) => p.variants.length && `${p.name} ${p.variants.map((v) => `${v.name} ${v.sku}`).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())).map((p) => ({ ...p, variants: p.variants.filter((v) => unit === 'all' || v.sellingUnit === unit) })).filter((p) => p.variants.length) || [];
  const lines = catalog ? cart.flatMap((line) => { try { return resolveCart(catalog, [line]); } catch { return []; } }) : [];
  const total = lines.reduce((sum, line) => sum + Math.round(line.total * 100), 0) / 100;
  function update(id: string, quantity: number) {
    setCheckout(''); setError('');
    setCart((current) => quantity <= 0 ? current.filter((line) => line.variantId !== id) : current.map((line) => line.variantId === id ? { ...line, quantity: Math.min(99, quantity) } : line));
  }
  function add(id: string) {
    setCheckout(''); setError('');
    setCart((current) => current.some((line) => line.variantId === id) ? current.map((line) => line.variantId === id ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line) : [...current, { variantId: id, quantity: 1 }]);
    setNotice('Added to your bag. Review it below the collection.');
  }
  async function refresh(forCheckout = false) {
    setBusy(true); setError(''); setCheckout('');
    try {
      const response = await fetch('/api/catalog', { cache: 'no-store' });
      if (!response.ok) throw new Error('The collection is temporarily unavailable. Please try again.');
      const latest: Catalog = await response.json();
      setCatalog(latest);
      if (forCheckout) {
        const number = whatsappNumber(latest.seller.whatsapp);
        if (!number) throw new Error('WhatsApp ordering will be available when the shop adds its number. Your bag is still here.');
        const message = whatsappMessage(latest, cart);
        setCheckout(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
        setNotice('Prices refreshed. Review your total, then continue to WhatsApp to send your order request.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  if (!catalog) return <div className="empty-state"><h3>The collection is taking a moment.</h3><p>We couldn’t connect to the shop. Please try again.</p><button className="button" disabled={busy} onClick={() => refresh()}>{busy ? 'Loading…' : 'Try again'}</button>{error && <p role="alert">{error}</p>}</div>;
  return <>
    <div className="collection-tools"><div className="filters" role="group" aria-label="Filter selling units">{[['all', 'All products'], ['item', 'By the piece'], ['box', 'By the box']].map(([value, label]) => <button key={value} className={`filter ${unit === value ? 'active' : ''}`} aria-pressed={unit === value} onClick={() => setUnit(value)}>{label}</button>)}</div><label className="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search products" placeholder="Find your sparkle" value={query} onChange={(e) => setQuery(e.target.value)} /></label><a className="bag-link" href="#bag">Your bag ({cart.reduce((sum, line) => sum + line.quantity, 0)}) ↓</a></div>
    <p className="sr-only" aria-live="polite">{products.length} products found</p><div className="product-grid">{products.map((product, index) => <ProductCard key={`${product.id}-${unit}`} product={product} index={index} add={add} />)}</div>
    {!products.length && <div className="empty-state"><p>No products match your search.</p><button className="button" onClick={() => { setQuery(''); setUnit('all'); }}>Show all products</button></div>}
    <p className="catalog-note">Prices from the shop’s current catalogue. Availability and final totals are confirmed by the shop on WhatsApp.</p>
    <section id="bag" className="shopping-bag" aria-label="Shopping bag"><div className="bag-heading"><div><span className="eyebrow">YOUR CELEBRATION, COLLECTED</span><h3>Your bag <em>of joy.</em></h3></div><span>{cart.reduce((sum, line) => sum + line.quantity, 0)} selected</span></div>
      <p className="cart-notice" role="status">{notice}</p>
      {cart.length === 0 ? <p className="empty-bag">A little empty, for now. Add something you love from the collection.</p> : <>
        {cart.map((entry) => {
          const line = lines.find((l) => l.variantId === entry.variantId);
          if (!line) return <div className="cart-line" key={entry.variantId}><p>This item is no longer available.</p><button onClick={() => update(entry.variantId, 0)}>Remove unavailable item</button></div>;
          return <div className="cart-line" key={line.variantId}><div><h4>{line.product.name}</h4><p>{line.variant.name} · {money(line.price)} / {line.variant.sellingUnit === 'box' ? `box (${line.variant.itemsPerBox} pieces)` : 'piece'}</p></div><div className="quantity-control"><button aria-label={`Decrease ${line.product.name} ${line.variant.name}`} onClick={() => update(line.variantId, line.quantity - 1)}>−</button><span aria-label="Quantity">{line.quantity}</span><button disabled={line.quantity >= 99} aria-label={`Increase ${line.product.name} ${line.variant.name}`} onClick={() => update(line.variantId, line.quantity + 1)}>+</button></div><strong>{money(line.total)}</strong><button className="remove-item" onClick={() => update(line.variantId, 0)} aria-label={`Remove ${line.product.name} ${line.variant.name}`}>Remove</button></div>;
        })}
        <div className="cart-total"><span>Estimated total</span><strong>{money(total)}</strong></div><p className="cart-help">Send your bag to the shop to confirm your order. No payment is collected on this website.</p>
        {error && <p className="cart-error" role="alert">{error}</p>}
        {checkout ? <a className="button whatsapp" href={checkout} target="_blank" rel="noopener noreferrer">Continue to WhatsApp ↗</a> : <button className="button whatsapp" disabled={busy || lines.length !== cart.length} onClick={() => refresh(true)}>{busy ? 'Checking current prices…' : 'Order on WhatsApp ↗'}</button>}
        <p className="cart-help">Your order is only sent when you press Send in WhatsApp.</p>
      </>}
    </section>
  </>;
}
