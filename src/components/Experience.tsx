"use client";

import { useEffect, useState } from "react";
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
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return <header className="header">
    <a href="#home" className="brand" aria-label="Baji Market home"><span className="brand-symbol" aria-hidden="true">✳</span> baji<span className="brand-sub">MARKET</span></a>
    <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? "Close −" : "Menu +"}</button>
    <nav id="main-nav" aria-label="Main navigation" className={open ? "nav is-open" : "nav"} onClick={() => setOpen(false)}>
      <a href="#collection">The collection</a><a href="#about">Our story</a><a href="#faq">Good to know</a><a className="nav-contact" href="#contact">Let’s celebrate <span aria-hidden="true">↗</span></a>
    </nav>
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
