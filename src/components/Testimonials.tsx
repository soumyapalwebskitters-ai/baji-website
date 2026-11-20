'use client';
import { useWebContent } from "./WebContentProvider";
import { useEffect, useState } from 'react';
import MotionSlider from './MotionSlider';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import ReviewForm, { type CustomerReview } from './ReviewForm';
import styles from './Testimonials.module.css';

export default function Testimonials() {
  const { copy } = useWebContent();
  const [direction, setDirection] = useState(1);
  const [active, setActive] = useState(0);
  const reduce = useMotionPreference();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    fetch('/api/reviews', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Customer reviews are temporarily unavailable.');
      const result = await response.json();
      if (!Array.isArray(result.reviews)) throw new Error('Customer reviews are temporarily unavailable.');
      if (!controller.signal.aborted) { setReviews(result.reviews); setActive(0); }
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const stories = reviews;
  const item = stories[Math.min(active, stories.length - 1)];
  const move = (step: number) => { if (stories.length < 2) return; setDirection(step); setActive(current => (current + step + stories.length) % stories.length); };
  return <section id="testimonials" className={`section container ${styles.section}`} aria-labelledby="testimonials-title" aria-roledescription="carousel">
    <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5 }}>
      <span className="eyebrow">{copy("Testimonials.1")}</span><h2 id="testimonials-title">{copy("Testimonials.2")}<br /><em>{copy("Testimonials.3")}</em></h2><p className={styles.disclaimer}>{copy("Testimonials.4")}</p><ReviewForm onSaved={review => { setReviews(current => [review, ...current.filter(item => item.id !== review.id)]); setActive(0); setLoadError(''); }} />
      {stories.length > 1 && <div className={styles.controls}><button type="button" onClick={() => move(-1)} aria-label="Previous testimonial">←</button><span>{String(active + 1).padStart(2, '0')} / {String(stories.length).padStart(2, '0')}</span><button type="button" onClick={() => move(1)} aria-label="Next testimonial">→</button></div>}
    </motion.div>
    <div className={styles.stage} aria-live="polite" aria-atomic="true">
      {item ? <><MotionSlider slideKey={item.id} direction={direction} onMove={move}><figure className={styles.card}>
        <span className={styles.quoteMark} aria-hidden="true">“</span><span className={styles.badge}>{copy("Testimonials.5")}</span><span className={styles.stars} aria-label={`${item.rating} out of 5 stars`}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span><blockquote>{item.quote}</blockquote><figcaption><span className={styles.avatar} aria-hidden="true">✳</span><span><strong>{item.name}</strong><small>{copy("Testimonials.6")}</small></span></figcaption>
      </figure></MotionSlider>
      {stories.length > 1 && <div className={styles.dots}>{stories.map((story, index) => <button key={story.id} type="button" aria-label={`Show testimonial ${index + 1}`} aria-current={active === index ? 'true' : undefined} onClick={() => { setDirection(index >= active ? 1 : -1); setActive(index); }}><motion.span animate={{ width: active === index ? 30 : 8, opacity: active === index ? 1 : .35 }} transition={{ duration: reduce ? 0 : .25 }} /></button>)}</div>}
      </> : <div className={styles.card} role="status">
        <p>{loading ? 'Loading customer reviews…' : loadError || 'No reviews yet. Be the first to share your story.'}</p>
        {!loading && loadError && <button type="button" className="button" onClick={() => setAttempt(current => current + 1)}>{copy("Testimonials.7")}</button>}
      </div>}
    </div>
  </section>;
}
