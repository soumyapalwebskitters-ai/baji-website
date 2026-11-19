'use client';

import { useMotionPreference } from "@/hooks/useMotionPreference";
import { useRef, useState } from 'react';
import Script from 'next/script';
import VariantDropdown from '@/components/VariantDropdown';
import QuantityStepper from '@/components/QuantityStepper';
import { RollingText } from '@/components/RollingText';
import { AnimatePresence, motion } from 'framer-motion';
import { money, resolveCart, unitPrice, type CartLine, type Catalog, type Product } from '@/lib/commerce';

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
declare global {
  interface Window {
    grecaptcha?: { ready: (callback: () => void) => void; execute: (key: string, options: { action: string }) => Promise<string> };
  }
}
async function orderToken(): Promise<string> {
  const api = window.grecaptcha;
  if (!recaptchaSiteKey) throw new Error('reCAPTCHA is unavailable. Your order has not been submitted. Please try again later.');
  if (!api) throw new Error('reCAPTCHA could not load. Please reload the page and try again.');
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Security check timed out. Please try again.')), 15000);
    api.ready(() => {
      Promise.resolve().then(() => api.execute(recaptchaSiteKey, { action: 'place_order' }))
        .then((token) => {
          if (!token) throw new Error('reCAPTCHA did not complete. Please try again.');
          resolve(token);
        })
        .catch(() => reject(new Error('reCAPTCHA verification failed. Your order has not been submitted. Please try again.')))
        .finally(() => window.clearTimeout(timer));
    });
  });
}

function ProductCard({ product, index, add }: { product: Product; index: number; add: (id: string) => void }) {
  const reduce = useMotionPreference();
  const [selected, setSelected] = useState(product.variants[0]?.id || '');
  const [failed, setFailed] = useState('');
  const variant = product.variants.find((v) => v.id === selected) || product.variants[0];
  if (!variant) return null;
  const source = variant.image || product.image;
  const price = unitPrice(variant);
  return <motion.article layout={reduce ? false : "position"} exit={{ opacity: 0, scale: reduce ? 1 : .97 }} className="product" initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: reduce ? 0 : .45, delay: reduce ? 0 : (index % 3) * .06 }} whileHover={reduce ? undefined : { y: -5 }}>
    <div className={`product-visual real-product ${['peach', 'sage', 'lavender'][index % 3]}`}><span className="product-category">{variant.sellingUnit === 'box' ? 'By the box' : 'By the piece'}</span><span className="product-number">/{String(index + 1).padStart(2, '0')}</span>
      {source && failed !== source ? <img src={source} onError={() => setFailed(source)} alt={`${product.name} — ${variant.name}`} width="480" height="420" loading="lazy" /> : <div className="image-placeholder"><span aria-hidden="true">✳</span><p>{product.name}</p><small>Photo coming soon</small></div>}
      <span className="product-sizes">{variant.itemsPerBox} {variant.itemsPerBox === 1 ? 'piece' : 'pieces'} per box</span>
    </div>
    <div className="product-info"><h3>{product.name}</h3><strong>{price === null ? 'Enquire' : money(price)}<small> / {variant.sellingUnit === 'box' ? 'box' : 'piece'}</small></strong></div>
    <div className="variant-label"><span>Choose a variant</span><VariantDropdown label={`Variant for ${product.name}`} value={variant.id} onChange={setSelected} options={product.variants.map(v => ({ value: v.id, label: v.name, detail: `${unitPrice(v) === null ? 'Enquire' : money(unitPrice(v)!)} / ${v.sellingUnit === 'box' ? 'box' : 'piece'}` }))} /></div>
    <motion.button initial="rest" animate="rest" whileHover="hover" whileFocus="hover" whileTap={reduce ? undefined : { scale: .97 }} type="button" className="button add-cart" disabled={price === null} onClick={() => add(variant.id)}><RollingText text="Add to bag" /><span aria-hidden="true">+</span></motion.button>
  </motion.article>;
}
export default function Storefront({ initialCatalog }: { initialCatalog: Catalog | null }) {
  const reduce = useMotionPreference();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState('');
  const cartRevision = useRef(0);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const products = catalog?.products.filter((p) => p.variants.length && `${p.name} ${p.variants.map((v) => `${v.name} ${v.sku}`).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())).map((p) => ({ ...p, variants: p.variants.filter((v) => unit === 'all' || v.sellingUnit === unit) })).filter((p) => p.variants.length) || [];
  const lines = catalog ? cart.flatMap((line) => { try { return resolveCart(catalog, [line]); } catch { return []; } }) : [];
  const total = lines.reduce((sum, line) => sum + Math.round(line.total * 100), 0) / 100;
  function update(id: string, quantity: number) {
    cartRevision.current += 1;
    setCheckout(''); setError('');
    setCart((current) => quantity <= 0 ? current.filter((line) => line.variantId !== id) : current.map((line) => line.variantId === id ? { ...line, quantity: Math.min(99, quantity) } : line));
  }
  function add(id: string) {
    cartRevision.current += 1;
    setCheckout(''); setError('');
    setCart((current) => current.some((line) => line.variantId === id) ? current.map((line) => line.variantId === id ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line) : [...current, { variantId: id, quantity: 1 }]);
    setNotice('Added to your bag. Review it below the collection.');
  }
  function triggerConfetti(x: number, y: number) {
    window.dispatchEvent(new CustomEvent("baji:confetti", { detail: { x, y } }));
  }

  async function refresh(forCheckout = false) {
    if (submitting.current) return;
    submitting.current = true;
    const revision = cartRevision.current;
    setBusy(true); setError(''); setCheckout('');
    try {
      const response = forCheckout
        ? await fetch('/api/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: await orderToken(), cart }), signal: AbortSignal.timeout(30000),
        })
        : await fetch('/api/catalog', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      setCatalog(forCheckout ? result.catalog : result);
      if (forCheckout && revision === cartRevision.current) {
        setCheckout(result.checkout);
        setNotice('Prices refreshed. Review your total, then continue to WhatsApp to send your order request.');
      }
    } catch (e) {
      setError(e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')
        ? 'The order check timed out. Your order has not been submitted. Please try again.'
        : e instanceof TypeError ? 'Could not connect. Check your internet connection and try again.'
        : e instanceof Error ? e.message : 'Unable to verify your order. Please try again.');
    }
    finally { submitting.current = false; setBusy(false); }
  }

  if (!catalog) return <div className="empty-state"><h3>The collection is taking a moment.</h3><p>We couldn’t connect to the shop. Please try again.</p><button className="button" disabled={busy} onClick={() => refresh()}>{busy ? 'Loading…' : 'Try again'}</button>{error && <p role="alert">{error}</p>}</div>;
  return <>
    {recaptchaSiteKey && <Script src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}`} strategy="afterInteractive" onError={() => setError('Security check could not load. Please reload and try again.')} />}
    <div className="collection-tools"><div className="filters" role="group" aria-label="Filter selling units">{[['all', 'All products'], ['item', 'By the piece'], ['box', 'By the box']].map(([value, label]) => <button key={value} className={`filter ${unit === value ? 'active' : ''}`} aria-pressed={unit === value} onClick={() => setUnit(value)}>{unit === value && <motion.span className="filter-highlight" layoutId="active-unit-filter" transition={{ duration: reduce ? 0 : .3, ease: [.22, 1, .36, 1] }} />}<span className="filter-label">{label}</span></button>)}</div><label className="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search products" placeholder="Find your sparkle" value={query} onChange={(e) => setQuery(e.target.value)} /></label><a className="bag-link" href="#bag">Your bag ({cart.reduce((sum, line) => sum + line.quantity, 0)})</a></div>
    <p className="sr-only" aria-live="polite">{products.length} products found</p><motion.div layout={!reduce} className="product-grid"><AnimatePresence initial={false}>{products.map((product, index) => <ProductCard key={`${product.id}-${unit}`} product={product} index={index} add={add} />)}</AnimatePresence></motion.div>
    {!products.length && <div className="empty-state"><p>No products match your search.</p><button className="button" onClick={() => { setQuery(''); setUnit('all'); }}>Show all products</button></div>}
    <p className="catalog-note">Prices from the shop’s current catalogue. Availability and final totals are confirmed by the shop on WhatsApp.</p>
    <motion.section initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduce ? 0 : .5 }} id="bag" className="shopping-bag" aria-label="Shopping bag"><div className="bag-heading"><div><span className="eyebrow">YOUR CELEBRATION, COLLECTED</span><h3>Your bag <em>of joy.</em></h3></div><motion.span key={cart.reduce((sum, line) => sum + line.quantity, 0)} initial={reduce ? false : { scale: 1.15, opacity: .5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .25 }}>{cart.reduce((sum, line) => sum + line.quantity, 0)} selected</motion.span></div>
      <p className="cart-notice" role="status">{notice}</p>
      <AnimatePresence initial={false} mode="wait">{cart.length === 0 ? <motion.p key="empty" className="empty-bag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .15 }}>A little empty, for now. Add something you love from the collection.</motion.p> : <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}>
        <AnimatePresence initial={false}>{cart.map((entry) => {
          const line = lines.find((l) => l.variantId === entry.variantId);
          if (!line) return <div className="cart-line" key={entry.variantId}><p>This item is no longer available.</p><button onClick={() => update(entry.variantId, 0)}>Remove unavailable item</button></div>;
          return <motion.div layout={!reduce} className="cart-line" key={line.variantId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, overflow: "hidden" }} transition={{ duration: reduce ? 0 : .25 }}><div><h4>{line.product.name}</h4><p>{line.variant.name} · {money(line.price)} / {line.variant.sellingUnit === 'box' ? `box (${line.variant.itemsPerBox} pieces)` : 'piece'}</p></div><QuantityStepper value={line.quantity} label={`${line.product.name} ${line.variant.name}`} onChange={quantity => update(line.variantId, quantity)} /><strong>{money(line.total)}</strong><button className="remove-item" onClick={() => update(line.variantId, 0)} aria-label={`Remove ${line.product.name} ${line.variant.name}`}>Remove</button></motion.div>;
        })}</AnimatePresence>
        <div className="cart-total"><span>Estimated total</span><motion.strong key={total} initial={reduce ? false : { opacity: .5, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>{money(total)}</motion.strong></div><p className="cart-help">Send your bag to the shop to confirm your order. No payment is collected on this website.</p>
        {(error || !recaptchaSiteKey) && <p className="cart-error" role="alert">{error || "reCAPTCHA is unavailable. Ordering is temporarily disabled. Please try again later."}</p>}
        {checkout ? <a className="button whatsapp" href={checkout} target="_blank" rel="noopener noreferrer" onClick={(e) => { triggerConfetti(e.clientX, e.clientY); }}>Continue to WhatsApp</a> : <button className="button whatsapp" disabled={busy || !recaptchaSiteKey || lines.length !== cart.length} onClick={() => { void refresh(true); }}>{busy ? 'Verifying and checking prices…' : 'Order on WhatsApp'}</button>}
        <p className="cart-help">Your order is only sent when you press Send in WhatsApp.</p>
      </motion.div>}</AnimatePresence>
    </motion.section>
  </>;
}
