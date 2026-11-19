"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate, useIsPresent } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";

export default function QuantityStepper({ value, label, onChange }: {
  value: number; label: string; onChange: (quantity: number) => void;
}) {
  const reduce = useMotionPreference();
  const present = useIsPresent();
  const latest = useRef(value);
  const [direction, setDirection] = useState(1);
  const [scope, animate] = useAnimate();
  useEffect(() => { latest.current = value; }, [value]);

  function step(change: number) {
    if (!present) return;
    const next = Math.min(99, Math.max(0, latest.current + change));
    if (next === latest.current) {
      if (!reduce) void animate(scope.current, { x: [0, change * 3, -change * 2, 0] }, { duration: .2 });
      return;
    }
    latest.current = next;
    setDirection(change);
    onChange(next);
  }

  return <div className="quantity-stepper">
    <div className="quantity-control" role="group" aria-label={`Quantity for ${label}`}>
      <StepButton label={`Decrease ${label}`} change={-1} disabled={value <= 0} onStep={step} />
      <div ref={scope} className="quantity-value" role="status" aria-label={`Quantity: ${value}`} aria-live="polite" aria-atomic="true">
        <span className="sr-only">{value}</span>
        <AnimatePresence initial={false} custom={direction}>
          <motion.span aria-hidden="true" key={value} className="quantity-digit" custom={direction} variants={{
            enter: (d: number) => ({ y: reduce ? 0 : d * 16, opacity: 0 }),
            visible: { y: 0, opacity: 1 },
            exit: (d: number) => ({ y: reduce ? 0 : -d * 16, opacity: 0 }),
          }} initial="enter" animate="visible" exit="exit" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 35, opacity: { duration: .1 } }}>{value}</motion.span>
        </AnimatePresence>
      </div>
      <StepButton label={`Increase ${label}`} change={1} disabled={value >= 99} onStep={step} />
    </div>
    <span className="quantity-hint">Hold to repeat</span>
  </div>;
}

function StepButton({ label, change, disabled, onStep }: {
  label: string; change: number; disabled: boolean; onStep: (change: number) => void;
}) {
  const reduce = useMotionPreference();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const held = useRef(false);
  useEffect(() => {
    const el = scope.current;
    const cancel = () => {
      if (held.current) el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, isPrimary: true }));
      held.current = false;
    };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    return () => { cancel(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', visibility); };
  }, [scope]);

  return <motion.button ref={scope} type="button" className="quantity-step" aria-label={label} aria-disabled={disabled || undefined}
    tap={{ hold: .4, repeat: .08 }}
    onTapStart={() => { held.current = true; onStep(change); }}
    onTapCancel={() => { held.current = false; }}
    onTap={event => {
      if (event.type === 'pointerup') { held.current = false; return; }
      onStep(change);
      if (!reduce && !disabled) void animate(scope.current, { scale: [.86, .94] }, { type: 'spring', stiffness: 600, damping: 24 });
    }}
    onKeyDown={event => {
      if (event.key === 'Enter') event.preventDefault(); // Motion handles Enter as a press, including repeats.
      if (event.key === ' ') { event.preventDefault(); if (!event.repeat) onStep(change); }
    }}
    onClick={event => { if (event.detail === 0 && !held.current) onStep(change); }}
    whileTap={reduce ? undefined : { scale: .9 }} transition={{ type: 'spring', stiffness: 600, damping: 26 }}>
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={change > 0 ? 'M3 8h10M8 3v10' : 'M3 8h10'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
  </motion.button>;
}
