'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import styles from './CustomerLogin.module.css';
import reviewStyles from './Testimonials.module.css';

export type CustomerReview = { id: string; name: string; rating: number; quote: string; created_at: string; updated_at: string };
export default function ReviewForm({ onSaved }: { onSaved: (review: CustomerReview) => void }) {
  const reduce = useMotionPreference();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const show = () => { setError(''); setOpen(true); };
    window.addEventListener('baji:review-ready', show);
    return () => window.removeEventListener('baji:review-ready', show);
  }, []);
  useEffect(() => {
    if (!open || !dialog.current) return;
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function close() { if (pending.current) return; dialog.current?.close(); setOpen(false); trigger.current?.focus(); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      // Refresh an expired access cookie before the API independently verifies it.
      await fetch('/api/customer-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'session' }), signal: AbortSignal.timeout(20000) });
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, quote, rating }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (response.status === 401) {
        dialog.current?.close(); setOpen(false);
        setNotice('Please sign in again. Your draft is still here.');
        window.setTimeout(() => window.dispatchEvent(new Event('baji:request-review')), 0);
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Unable to save your review.');
      onSaved(result.review); setNotice('Thank you! Your review has been saved.');
      dialog.current?.close(); setOpen(false); trigger.current?.focus();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save your review. Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <>
    <motion.button ref={trigger} className={`button ${reviewStyles.addReview}`} type="button" aria-haspopup="dialog" whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: .97 }} onClick={() => { setNotice(''); window.dispatchEvent(new Event('baji:request-review')); }}>Add review <span aria-hidden="true">＋</span></motion.button>
    {notice && <p className={reviewStyles.disclaimer} role="status">{notice}</p>}
    {open && createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby="review-form-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} data-lenis-prevent>
      <motion.div className={styles.panel} initial={reduce ? false : { opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
        <button type="button" className={styles.close} disabled={busy} onClick={close} aria-label="Close review form">×</button>
        <span className="eyebrow">YOUR CELEBRATION, YOUR WORDS</span><h2 id="review-form-title">Share your <em>spark.</em></h2>
        <form onSubmit={submit} className={reviewStyles.form}>
          <label className={styles.field}>Public display name<input autoFocus autoComplete="nickname" required minLength={2} maxLength={60} value={name} onChange={event => setName(event.target.value)} disabled={busy} /></label>
          <fieldset className={reviewStyles.rating}><legend>Your rating</legend>{[1, 2, 3, 4, 5].map(value => <label key={value}><input type="radio" name="review-rating" value={value} checked={rating === value} onChange={() => setRating(value)} disabled={busy} /><span aria-hidden="true" className={value <= rating ? reviewStyles.starActive : undefined}>★</span><span className="sr-only">{value} {value === 1 ? 'star' : 'stars'}</span></label>)}</fieldset>
          <label className={styles.field}>Your review<textarea required minLength={10} maxLength={1500} rows={5} value={quote} onChange={event => setQuote(event.target.value)} disabled={busy} placeholder="Tell us about your experience…" /><small>{quote.length}/1500 characters</small></label>
          <small className={styles.note}>Your name, rating, and review will be public. Your phone number stays private. Submitting again updates your existing review.</small>
          <button type="submit" className="button" disabled={busy}>{busy ? 'Saving…' : 'Publish review'} <span aria-hidden="true">↗</span></button>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>
      </motion.div>
    </dialog>, document.body)}
  </>;
}
