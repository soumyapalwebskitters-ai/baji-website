'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import styles from './CustomerLogin.module.css';
import { RollingText } from './RollingText';

type User = { phone: string };
async function request(action: string, data = {}) {
  const response = await fetch('/api/customer-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Please try again.');
  return result;
}
export default function CustomerLogin() {
  const reduce = useMotionPreference();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [reviewIntent, setReviewIntent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => { setMounted(true); void request('session').then(result => setUser(result.user)).catch(() => {}); }, []);
  useEffect(() => {
    const writeReview = () => {
      setError('');
      // Refresh the HTTP-only session before deciding which dialog to open.
      void request('session').then(result => {
        setUser(result.user);
        setReviewIntent(true);
        if (!result.user) setOpen(true);
      }).catch(() => { setUser(null); setReviewIntent(true); setOpen(true); });
    };
    window.addEventListener('baji:request-review', writeReview);
    return () => window.removeEventListener('baji:request-review', writeReview);
  }, []);
  useEffect(() => {
    if (reviewIntent && user && !open) {
      setReviewIntent(false);
      window.dispatchEvent(new Event('baji:review-ready'));
    }
  }, [reviewIntent, user, open]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  useEffect(() => {
    if (!open || !dialog.current) return;
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function close() { if (pending.current) return; dialog.current?.close(); setOpen(false); setReviewIntent(false); setError(''); trigger.current?.focus(); }
  async function act(action: 'send' | 'verify' | 'logout') {
    if (pending.current || (action === 'send' && cooldown > 0)) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await request(action, { phone: `+91${phone}`, code });
      if (action === 'send') { setSent(true); setCooldown(60); setCode(''); }
      else { setUser(result.user); setSent(false); setCode(''); if (action === 'verify' && reviewIntent) { dialog.current?.close(); setOpen(false); } }
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void act(sent ? 'verify' : 'send'); }
  return <>
    <motion.button ref={trigger} type="button" className={styles.loginButton} whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: .95 }} onClick={() => { setReviewIntent(false); setOpen(true); }} aria-haspopup="dialog">{user ? 'Account' : 'Login'} <span aria-hidden="true">↗</span></motion.button>
    {mounted && createPortal(<AnimatePresence>{open && <dialog ref={dialog} className={styles.dialog} aria-labelledby="customer-login-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} data-lenis-prevent>
      <motion.div className={styles.panel} initial={reduce ? false : { opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
        <button type="button" className={styles.close} onClick={close} disabled={busy} aria-label="Close login">×</button>
        <span className={styles.spark} aria-hidden="true">✳</span><span className="eyebrow">YOUR BAJI ACCOUNT</span>
        <h2 id="customer-login-title">{user ? 'You’re in.' : sent ? 'One little code.' : 'Welcome'} {!user && !sent && <em>back.</em>}</h2>
        {user ? <><p>Signed in with +{user.phone.replace(/^\+/, '')}.</p><button className="button" type="button" disabled={busy} onClick={() => void act('logout')}>{busy ? 'Signing out…' : 'Sign out'}</button></> : <form onSubmit={submit}>
          <p>{sent ? `Enter the code sent to +91${phone}.` : reviewIntent ? 'Sign in with your phone number to write a review. We’ll open your review form after verification.' : 'Sign in or create an account with your phone number. No password to remember.'}</p>
          {sent ? <label className={styles.field}>Verification code<input key="code" autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" disabled={busy} /></label> : <label className={styles.field}>Phone number<span className={styles.phoneInput}><span className={styles.phonePrefix} aria-hidden="true">+91</span><input key="phone" autoFocus type="tel" inputMode="numeric" autoComplete="tel-national" aria-label="Phone number, country code +91" pattern="[0-9]{10}" required value={phone} onChange={event => {
            const digits = event.target.value.replace(/\D/g, '');
            setPhone((digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits).slice(0, 10));
          }} placeholder="98765 43210" disabled={busy} /></span><small>Enter your 10-digit phone number.</small></label>}
          <motion.button type="submit" className={`button ${styles.verificationButton}`} disabled={busy || (!sent && cooldown > 0)} initial="rest" animate="rest" whileHover="hover" whileFocus="hover" whileTap={reduce ? undefined : { scale: .98 }}><RollingText text={busy ? 'Please wait…' : sent ? 'Verify & sign in' : cooldown ? `Try again in ${cooldown}s` : 'Send verification code'} /></motion.button>
          {sent && <div className={styles.secondary}><button type="button" disabled={busy} onClick={() => { setSent(false); setCode(''); setError(''); }}>Change number</button><button type="button" disabled={busy || cooldown > 0} onClick={() => void act('send')}>{cooldown ? `Resend in ${cooldown}s` : 'Resend code'}</button></div>}
          <small className={styles.note}>You can also browse and order as a guest.</small>
        </form>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </motion.div>
    </dialog>}</AnimatePresence>, document.body)}
  </>;
}
