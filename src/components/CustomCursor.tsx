"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";

export default function CustomCursor() {
  const reduce = useMotionPreference();
  const targetX = useMotionValue(-100), targetY = useMotionValue(-100);
  const x = useSpring(targetX, { stiffness: 420, damping: 35 });
  const y = useSpring(targetY, { stiffness: 420, damping: 35 });
  const [visible, setVisible] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [label, setLabel] = useState('');
  useEffect(() => {
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => {
      document.documentElement.classList.toggle('has-custom-cursor', fine.matches && !reduce);
      if (!fine.matches || reduce) setVisible(false);
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || reduce || event.pointerType !== 'mouse' || document.querySelector('dialog[open]')) { setVisible(false); return; }
      targetX.set(event.clientX); targetY.set(event.clientY); setVisible(true);
      const el = event.target instanceof Element ? event.target.closest('button,a,input,textarea,[role="option"]') : null;
      setInteractive(Boolean(el)); setLabel(el?.getAttribute('data-cursor-label') || '');
    };
    const hide = () => setVisible(false);
    update(); fine.addEventListener('change', update);
    window.addEventListener('pointermove', move); document.documentElement.addEventListener('pointerleave', hide); window.addEventListener('blur', hide);
    return () => {
      fine.removeEventListener('change', update); window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', hide); window.removeEventListener('blur', hide); document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [reduce, targetX, targetY]);
  if (reduce) return null;
  return <motion.div className="floating-cursor-position" aria-hidden="true" style={{ x, y }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: .15 }}><motion.div className="floating-cursor-ring" animate={{ width: label ? 76 : interactive ? 38 : 12, height: label ? 76 : interactive ? 38 : 12, backgroundColor: label ? 'rgba(212,175,55,.92)' : 'rgba(212,175,55,.08)' }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>{label}</motion.div></motion.div>;
}
