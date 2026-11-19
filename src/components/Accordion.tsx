"use client";

import { useMotionPreference } from "@/hooks/useMotionPreference";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

type Item = { id: string; title: string; content: ReactNode };

export default function Accordion({ items, className = "" }: { items: Item[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useMotionPreference();
  useEffect(() => {
    const reveal = (hash: string) => {
      const id = hash.slice(1);
      if (items.some(item => item.id === id)) setOpen(id);
    };
    const onHash = () => reveal(window.location.hash);
    const onLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (link) reveal(link.getAttribute('href') || '');
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onLink, true);
    return () => { window.removeEventListener('hashchange', onHash); document.removeEventListener('click', onLink, true); };
  }, [items]);

  return <div className={`accordion ${className}`}>{items.map(item => {
    const expanded = open === item.id;
    return <div key={item.id} id={item.id} className={`accordion-item${expanded ? ' is-open' : ''}`}>
      <h3><button id={`${item.id}-trigger`} className="accordion-trigger" aria-expanded={expanded} aria-controls={`${item.id}-content`} onClick={() => setOpen(expanded ? null : item.id)}>
        {item.title}<motion.span aria-hidden="true" animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: reduce ? 0 : .25 }}>+</motion.span>
      </button></h3>
      <motion.div id={`${item.id}-content`} role="region" aria-labelledby={`${item.id}-trigger`} aria-hidden={!expanded} inert={!expanded} className="accordion-panel" initial={false} animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }} transition={{ duration: reduce ? 0 : .38, ease: [.22, 1, .36, 1] }}>
        <div className="accordion-content">{item.content}</div>
      </motion.div>
    </div>;
  })}</div>;
}
