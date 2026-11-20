'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';

export default function MotionSlider({ slideKey, direction, onMove, children }: {
  slideKey: string | number;
  direction: number;
  onMove: (step: number) => void;
  children: ReactNode;
}) {
  const reduce = useMotionPreference();
  return <div role="group" aria-label="Slides; use left and right arrow keys to navigate" tabIndex={0} style={{ overflow: 'hidden' }} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onMove(event.key === 'ArrowRight' ? 1 : -1); }
  }}>
    <AnimatePresence initial={false} mode="wait" custom={direction}>
      <motion.div key={slideKey} custom={direction} variants={{
        enter: (step: number) => ({ x: reduce ? 0 : `${step * 100}%`, opacity: reduce ? 1 : 0 }),
        center: { x: 0, opacity: 1 },
        exit: (step: number) => ({ x: reduce ? 0 : `${-step * 100}%`, opacity: reduce ? 1 : 0 }),
      }} initial="enter" animate="center" exit="exit"
        transition={{ duration: reduce ? 0 : .28, ease: [.22, 1, .36, 1] }}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={reduce ? 0 : .15}
        style={{ touchAction: 'pan-y' }}
        onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 500) onMove(info.offset.x === 0 ? (info.velocity.x < 0 ? 1 : -1) : (info.offset.x < 0 ? 1 : -1)); }}>
        {children}
      </motion.div>
    </AnimatePresence>
  </div>;
}
