"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";

type Option = { value: string; label: string; detail: string };

export default function VariantDropdown({ label, value, options, onChange }: {
  label: string; value: string; options: Option[]; onChange: (value: string) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ above: false, maxHeight: 240 });
  const reduce = useMotionPreference();
  const selected = Math.max(0, options.findIndex(option => option.value === value));

  function show(index = selected) { setActive(index); setOpen(true); }
  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = innerHeight - rect.bottom - 16;
      const above = rect.top - 84;
      const upward = below < 240 && above > below;
      setPlacement({ above: upward, maxHeight: Math.max(80, Math.min(280, upward ? above : below)) });
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    place();
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    const option = list.current?.children[active] as HTMLElement | undefined;
    if (!open || !option || !list.current) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.current.scrollTop) list.current.scrollTop = top;
    else if (bottom > list.current.scrollTop + list.current.clientHeight) list.current.scrollTop = bottom - list.current.clientHeight;
  }, [active, open]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      if (key === 'Enter' || key === ' ') { if (open) choose(active); else show(); }
      else if (key === 'Home') show(0);
      else if (key === 'End') show(options.length - 1);
      else if (!open) show();
      else setActive(current => (current + (key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (key === 'Escape') { event.preventDefault(); setOpen(false); }
    else if (key === 'Tab') setOpen(false);
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = performance.now();
      search.current = { text: now - search.current.time > 600 ? key : search.current.text + key, time: now };
      const index = options.findIndex(option => option.label.toLowerCase().startsWith(search.current.text.toLowerCase()));
      if (index >= 0) show(index);
    }
  }

  return <div ref={root} className="variant-dropdown" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <button ref={trigger} type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${active}` : undefined} className="variant-trigger" onClick={() => open ? setOpen(false) : show()} onKeyDown={onKeyDown}>
      <span>{options[selected]?.label || 'Choose a variant'}</span>
      <motion.svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduce ? 0 : .2 }}><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
    </button>
    {open && <motion.ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className={`variant-options${placement.above ? ' opens-above' : ''}`} style={{ maxHeight: placement.maxHeight }} data-lenis-prevent initial={reduce ? false : { opacity: 0, y: placement.above ? 6 : -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : .18 }}>
      {options.map((option, index) => <li key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} className={`variant-option${active === index ? ' is-highlighted' : ''}`} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span><span className="variant-option-name">{option.label}</span><span className="variant-option-detail">{option.detail}</span></span><span className="variant-check" aria-hidden="true">{option.value === value ? '✓' : ''}</span>
      </li>)}
    </motion.ul>}
  </div>;
}
