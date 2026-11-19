"use client";

import { useMotionPreference } from "@/hooks/useMotionPreference";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { RollingLink } from "@/components/RollingText";
import { animate, hover, inView, motion, stagger } from "framer-motion";
import RevealHeading from "@/components/RevealHeading";
import FloatingTarget from "@/components/FloatingTarget";
import type { Catalog } from "@/lib/commerce";
import { whatsappNumber } from "@/lib/commerce";

export function Motion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (preference.matches) return;
      const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        autoResize: true,
        anchors: true,
      });
      const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], .celebration-strip, .footer-top, .footer-bottom, .collection-tools, .policy-intro'));
      const animations: ReturnType<typeof animate>[] = [];
      elements.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(24px)'; });
      const details = Array.from(document.querySelectorAll<HTMLElement>('.steps article, .story-copy > p, .enquiry-row > *, .occasion-card > div > *'));
      const stop = inView(elements, el => {
        animations.push(animate(el, { opacity: 1, transform: 'translateY(0px)' }, { duration: .75, ease: [.22, 1, .36, 1] }));
        const children = details.filter(child => el.contains(child));
        if (children.length) animations.push(animate(children, { opacity: [0, 1], y: [16, 0] }, { duration: .65, delay: stagger(.1), ease: [.22, 1, .36, 1] }));
      }, { margin: '0px 0px -35px 0px' });
      const interactions = new Map<Element, ReturnType<typeof animate>>();
      const stopHover = hover('a.button, .text-link, .back-top', el => {
        interactions.get(el)?.stop();
        interactions.set(el, animate(el, { y: -3 }, { type: 'spring', stiffness: 350, damping: 22 }));
        return () => { interactions.get(el)?.stop(); interactions.set(el, animate(el, { y: 0 }, { type: 'spring', stiffness: 350, damping: 22 })); };
      });
      cleanup = () => {
        lenis.destroy(); stop(); stopHover(); interactions.forEach(animation => animation.stop()); animations.forEach(animation => animation.stop());
        [...elements, ...details, ...document.querySelectorAll<HTMLElement>('a.button, .text-link, .back-top')].forEach(el => { el.style.removeProperty('opacity'); el.style.removeProperty('transform'); });
      };
    };
    setup(); preference.addEventListener('change', setup);
    return () => { cleanup(); preference.removeEventListener('change', setup); };
  }, []);
  return null;
}

export function Navigation() {
  const reduce = useMotionPreference();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState(100);
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('baji-theme') === 'light' ? 'light' : 'dark';
      const savedSize = Math.min(125, Math.max(90, Number(localStorage.getItem('baji-text-size')) || 100));
      setTheme(savedTheme); setSize(savedSize);
      document.documentElement.dataset.theme = savedTheme;
      document.documentElement.style.fontSize = `${savedSize}%`;
    } catch { /* Preferences remain available without storage. */ }
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  function changeTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); document.documentElement.dataset.theme = next;
    try { localStorage.setItem('baji-theme', next); } catch {}
  }
  function changeSize(next: number) {
    setSize(next); document.documentElement.style.fontSize = `${next}%`;
    try { localStorage.setItem('baji-text-size', String(next)); } catch {}
  }
  return <motion.header className="header" initial={reduce ? false : { y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: reduce ? 0 : .5 }}>
    <a href="#home" className="brand" aria-label="Baji Market home"><motion.span className="brand-symbol" aria-hidden="true" whileHover={reduce ? undefined : { rotate: 90 }} transition={{ duration: .4 }}>✳</motion.span><span>baji<span className="brand-sub">MARKET</span></span></a>
    <nav id="main-nav" aria-label="Main navigation" className="nav" onClick={() => setOpen(false)}><a href="#collection">Collection</a><a href="#about">Our story</a><a href="#gallery">Gallery</a><a href="#faq">Good to know</a></nav>
    <div className="nav-controls"><div className="text-controls" role="group" aria-label="Text size"><button aria-label="Decrease text size" disabled={size <= 90} onClick={() => changeSize(Math.max(90, size - 5))}>A−</button><span className="sr-only" role="status">Text size {size}%</span><button aria-label="Increase text size" disabled={size >= 125} onClick={() => changeSize(Math.min(125, size + 5))}>A+</button></div><button className="theme-toggle" onClick={changeTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? '☀' : '☾'}</button><a className="nav-bag" href="#bag" aria-label="View shopping bag">Bag</a></div>
    <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? 'Close −' : 'Menu +'}</button>
    <motion.nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation" aria-hidden={!open} inert={!open} initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: reduce ? 0 : .35, ease: [.22, 1, .36, 1] }}>
      <div className="mobile-nav-links">{[['#collection', 'Collection'], ['#about', 'Our story'], ['#gallery', 'Gallery'], ['#faq', 'Good to know'], ['#bag', 'Your bag']].map(([href, label], index) => <motion.a key={href} href={href} onClick={() => setOpen(false)} animate={{ x: open ? 0 : -12, opacity: open ? 1 : 0 }} transition={{ duration: reduce ? 0 : .25, delay: open && !reduce ? index * .045 : 0 }}>{label}</motion.a>)}</div>
    </motion.nav>
  </motion.header>;
}

export function Contact({ seller }: { seller: Catalog['seller'] | undefined }) {
  const reduce = useMotionPreference();
  const number = whatsappNumber(seller?.whatsapp || '');
  return <div className="contact-card" data-reveal>
    <span className="eyebrow light">A GOOD EVENING STARTS HERE</span><RevealHeading>Have a celebration<br />in <em>mind?</em></RevealHeading><p>Let’s find a little sparkle for it.</p>
    <div className="enquiry-row">
      {number ? <RollingLink href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" className="button cream" text="Chat on WhatsApp" /> : <RollingLink href="#collection" className="button cream" text="Explore the collection" />}
      {seller?.email && <a href={`mailto:${seller.email}`}>{seller.email}</a>}
      {seller?.phone && <a href={`tel:${seller.phone.replace(/[^+\d]/g, '')}`}>{seller.phone}</a>}
    </div>
    {seller?.address && <p>{seller.address}</p>}
    <motion.span className="contact-star" aria-hidden="true" initial={false} whileInView={reduce ? {} : { rotate: [0, 35, 0], scale: [1, 1.05, 1] }} viewport={{ once: true }} transition={{ duration: 3, ease: "easeInOut" }}>✳</motion.span>
  </div>;
}


const BANNER_SLIDES = [
  { type: "video", src: "/videos/banner-145094.mp4" },
  { type: "video", src: "/videos/fireworks.mp4" },
  { type: "video", src: "/videos/312954_large.mp4" },
  { type: "video", src: "/videos/144735-785264999_medium.mp4" },
  { type: "image", src: "/images/pexels-new-years-eve-1283521_1920.jpg" },
  { type: "image", src: "/images/shantanukashyap-firework-2869251_1920.jpg" },
  { type: "image", src: "/images/sandeepan-fireworks-614268_1920.jpg" },
];

export function FireworksBanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const slide = BANNER_SLIDES[index];

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(preference.matches); setPaused(preference.matches); };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    if (paused) el.pause();
    else void el.play().catch(() => { /* Keep slide navigation available if autoplay is blocked. */ });
  }, [index, paused, reducedMotion]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setFailed(false);
      setIndex((current) => (current + 1) % BANNER_SLIDES.length);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [index, paused, reducedMotion]);

  function selectSlide(next: number) {
    if (next === index) return;
    setFailed(false);
    setIndex((next + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }

  return <section id="home" className="hero" aria-roledescription="carousel" aria-label="Celebration highlights">
    <div className="hero-art">
      <img src="/images/fireworks-poster.jpg" alt="" fetchPriority="high" />
      <motion.div key={slide.src} className="hero-media" initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .9 }}>
        {slide.type === "video" ? <video ref={video} className={`hero-video${failed ? ' is-unavailable' : ''}`} src={slide.src} poster="/images/fireworks-poster.jpg" autoPlay={!paused} muted playsInline loop preload="metadata" aria-hidden="true" onError={() => setFailed(true)} /> : <img className={`hero-video${failed ? ' is-unavailable' : ''}`} src={slide.src} alt="" onError={() => setFailed(true)} />}
      </motion.div>
    </div>
    <div className="hero-topline"><span>THE ART OF CELEBRATING</span><span>BAJI MARKET · AFTER DARK</span></div>
    <div className="hero-copy">
      <div className="hero-slide-copy">
        <span className="eyebrow">A LITTLE SPARK. A LOT OF CELEBRATION.</span>
        <h1><span className="hero-title-line"><span>Own the</span></span><span className="hero-title-line"><em>night.</em></span><span className="hero-asterisk" aria-hidden="true">✳</span></h1>
        <div className="hero-description"><p>Some nights deserve more than a memory.<br />Give yours a sky full of colour.</p><RollingLink className="button" href="#collection" text="Explore the collection" /></div>
      </div>
    </div>
    <div className="hero-floating-target"><FloatingTarget /></div>
    <button className="video-control" type="button" aria-label={paused ? 'Play banner slideshow' : 'Pause banner slideshow'} onClick={() => setPaused((current) => !current)}>{paused ? '▷ PLAY THE SKY' : 'Ⅱ PAUSE THE SKY'}</button>
    <div className="hero-note"><span className="hero-note-spark" aria-hidden="true">✳</span><p>For the nights<br />you’ll talk about tomorrow.</p></div>
    <motion.button className="launch-skyshot" type="button" whileHover={reducedMotion ? undefined : { scale: 1.04 }} whileTap={reducedMotion ? undefined : { scale: .95 }}>Launch a skyshot <span aria-hidden="true">↑</span></motion.button>
    <div className="hero-slider-controls" role="group" aria-label="Banner slides">
      {BANNER_SLIDES.map((item, i) => <button key={item.src} type="button" className={`hero-slide-dot${i === index ? ' is-active' : ''}`} aria-label={`Show ${item.type} slide ${i + 1}`} aria-current={i === index ? 'true' : undefined} onClick={() => selectSlide(i)}><motion.span aria-hidden="true" animate={{ scale: i === index ? 1.4 : 1, opacity: i === index ? 1 : .4 }} transition={{ duration: reducedMotion ? 0 : .3 }} /></button>)}
    </div>
    <div className="hero-bottom"><span><i /> THE SKY IS YOUR CANVAS</span><a href="#collection">SCROLL TO DISCOVER</a><span>LIGHT / COLOUR / WONDER</span></div>
  </section>;
}

export function SkyshotEffects() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    const ctx = surface?.getContext('2d');
    if (!surface || !ctx) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; age: number; hue: number; trail: {x: number; y: number}[] };
    type Rocket = { x: number; y: number; targetY: number; hue: number };
    let particles: Particle[] = [], rockets: Rocket[] = [], frame = 0, last = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      surface.width = innerWidth * dpr; surface.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const burst = (rocket: Rocket) => {
      for (let i = 0; i < 140; i++) {
        const angle = Math.random() * Math.PI * 2, speed = Math.pow(Math.random(), .35) * 5.7 + .5;
        particles.push({ x: rocket.x, y: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 65 + Math.random() * 45, age: 0, hue: rocket.hue + Math.random() * 6, trail: [] });
      }
      particles = particles.slice(-700);
    };
    const draw = (time: number) => {
      const dt = Math.min((time - last) / 16.67 || 1, 2); last = time;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      rockets = rockets.filter(r => {
        r.y -= 15 * dt;
        const gradient = ctx.createLinearGradient(r.x, r.y, r.x, r.y + 95);
        gradient.addColorStop(0, '#fff3cb'); gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient; ctx.fillRect(r.x, r.y, 2, 95);
        if (r.y <= r.targetY) { burst(r); return false; } return true;
      });
      particles = particles.filter(p => p.age < p.life);
      for (const p of particles) {
        p.trail.unshift({ x: p.x, y: p.y }); p.trail = p.trail.slice(0, 9);
        p.vx *= Math.pow(.981, dt); p.vy = p.vy * Math.pow(.985, dt) + .035 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.age += dt;
        const alpha = Math.pow(1 - p.age / p.life, .7);
        ctx.strokeStyle = `hsla(${p.hue}, 95%, 72%, ${Math.max(0, alpha * .7)})`;
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y);
        p.trail.forEach(t => ctx.lineTo(t.x, t.y)); ctx.stroke();
        ctx.fillStyle = `rgba(255,246,222,${Math.max(0, alpha)})`;
        ctx.fillRect(p.x - .8, p.y - .8, 1.6, 1.6);
      }
      ctx.globalCompositeOperation = 'source-over';
      frame = particles.length || rockets.length ? requestAnimationFrame(draw) : 0;
    };
    const launch = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button, a.button') : null;
      if (!target || target.hasAttribute('disabled') || preference.matches || document.hidden) return;
      const rect = target.getBoundingClientRect();
      const x = event.detail ? event.clientX : rect.left + rect.width / 2;
      rockets.push({ x: Math.max(65, Math.min(innerWidth - 65, x)), y: innerHeight + 20, targetY: Math.max(100, innerHeight * (.2 + Math.random() * .23)), hue: 42 + Math.random() * 4 });
      rockets = rockets.slice(-4);
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(draw); }
    };
    const clear = () => { cancelAnimationFrame(frame); frame = 0; particles = []; rockets = []; ctx.clearRect(0, 0, innerWidth, innerHeight); };
    resize(); window.addEventListener('resize', resize); document.addEventListener('click', launch);
    document.addEventListener('visibilitychange', clear); preference.addEventListener('change', clear);
    return () => { clear(); window.removeEventListener('resize', resize); document.removeEventListener('click', launch); document.removeEventListener('visibilitychange', clear); preference.removeEventListener('change', clear); };
  }, []);
  return <canvas ref={canvas} className="skyshot-canvas" aria-hidden="true" />;
}
