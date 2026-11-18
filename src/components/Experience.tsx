"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import type { Catalog } from "@/lib/commerce";
import { whatsappNumber } from "@/lib/commerce";

export function Motion() {
  useEffect(() => {
    const openPolicy = () => {
      const id = window.location.hash.slice(1);
      if (id === 'terms' || id === 'privacy') document.querySelector<HTMLDetailsElement>(`#${id}`)?.setAttribute('open', '');
    };
    const followPolicy = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      const target = link?.getAttribute('href');
      if (target === '#terms' || target === '#privacy') document.querySelector<HTMLDetailsElement>(target)?.setAttribute('open', '');
    };
    openPolicy();
    window.addEventListener('hashchange', openPolicy);
    document.addEventListener('click', followPolicy, true);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let observer: IntersectionObserver | undefined;
    const clean = () => {
      lenis?.destroy();
      observer?.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
    const setup = () => {
      clean();
      if (preference.matches) return;
      lenis = new Lenis({ autoRaf: true, duration: 1.15, anchors: { offset: -100 } });
      document.documentElement.classList.add("motion-ready");
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      document.querySelectorAll("[data-reveal]").forEach((el) => observer?.observe(el));
    };
    setup();
    preference.addEventListener("change", setup);
    return () => { clean(); preference.removeEventListener("change", setup); window.removeEventListener("hashchange", openPolicy); document.removeEventListener("click", followPolicy, true); };
  }, []);
  return null;
}

export function Navigation() {
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
  return <header className="header">
    <a href="#home" className="brand" aria-label="Baji Market home"><span className="brand-symbol" aria-hidden="true">✳</span><span>baji<span className="brand-sub">MARKET</span></span></a>
    <nav id="main-nav" aria-label="Main navigation" className={open ? 'nav is-open' : 'nav'} onClick={() => setOpen(false)}><a href="#collection">Collection ↗</a><a href="#about">Our story</a><a href="#faq">Good to know</a></nav>
    <div className="nav-controls"><div className="text-controls" role="group" aria-label="Text size"><button aria-label="Decrease text size" disabled={size <= 90} onClick={() => changeSize(Math.max(90, size - 5))}>A−</button><span className="sr-only" role="status">Text size {size}%</span><button aria-label="Increase text size" disabled={size >= 125} onClick={() => changeSize(Math.min(125, size + 5))}>A+</button></div><button className="theme-toggle" onClick={changeTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? '☀' : '☾'}</button><a className="nav-bag" href="#bag" aria-label="View shopping bag">Bag ↗</a></div>
    <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? 'Close −' : 'Menu +'}</button>
  </header>;
}

export function Contact({ seller }: { seller: Catalog['seller'] | undefined }) {
  const number = whatsappNumber(seller?.whatsapp || '');
  return <div className="contact-card" data-reveal>
    <span className="eyebrow light">A GOOD EVENING STARTS HERE</span><h2>Have a celebration<br />in <em>mind?</em></h2><p>Let’s find a little sparkle for it.</p>
    <div className="enquiry-row">
      {number ? <a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" className="button cream">Chat on WhatsApp ↗</a> : <a href="#collection" className="button cream">Explore the collection ↗</a>}
      {seller?.email && <a href={`mailto:${seller.email}`}>{seller.email}</a>}
      {seller?.phone && <a href={`tel:${seller.phone.replace(/[^+\d]/g, '')}`}>{seller.phone}</a>}
    </div>
    {seller?.address && <p>{seller.address}</p>}
    <span className="contact-star" aria-hidden="true">✳</span>
  </div>;
}


export function FireworksBanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (preference.matches) { video.current?.pause(); setPaused(true); }
      else video.current?.play().then(() => setPaused(false)).catch(() => setPaused(true));
    };
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  return <>
    <img src="/images/fireworks-poster.jpg" alt="Golden fireworks bursting across the night sky" fetchPriority="high" />
    {!failed && <video ref={video} className="hero-video" src="/videos/fireworks.mp4" poster="/images/fireworks-poster.jpg" autoPlay muted loop playsInline preload="auto" aria-hidden="true" onError={() => setFailed(true)} />}
    {!failed && <button className="video-control" aria-label={paused ? 'Play fireworks video' : 'Pause fireworks video'} onClick={() => {
      if (paused) video.current?.play().then(() => setPaused(false)).catch(() => setPaused(true));
      else { video.current?.pause(); setPaused(true); }
    }}>{paused ? '▷ PLAY THE SKY' : 'Ⅱ PAUSE THE SKY'}</button>}
    <button className="launch-skyshot" type="button">Launch a skyshot <span aria-hidden="true">↑</span></button>
  </>;
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
        particles.push({ x: rocket.x, y: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 65 + Math.random() * 45, age: 0, hue: rocket.hue + Math.random() * 20, trail: [] });
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
      rockets.push({ x: Math.max(65, Math.min(innerWidth - 65, x)), y: innerHeight + 20, targetY: Math.max(100, innerHeight * (.2 + Math.random() * .23)), hue: Math.random() > .4 ? 32 : 195 });
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
