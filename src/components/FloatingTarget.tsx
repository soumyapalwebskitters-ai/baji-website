"use client";

import { useId, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";

export default function FloatingTarget() {
  const id = useId();
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref);
  const reduce = useMotionPreference();
  const targetX = useMotionValue(0), targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 160, damping: 16 });
  const y = useSpring(targetY, { stiffness: 160, damping: 16 });
  return <motion.a ref={ref} href="#gallery" className="floating-target" aria-label="View the celebration gallery" data-cursor-label="Explore" initial="rest" whileHover="hover" whileFocus="hover" whileTap={reduce ? undefined : { scale: .95 }} onPointerMove={event => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    targetX.set((event.clientX - rect.left - rect.width / 2) * .18);
    targetY.set((event.clientY - rect.top - rect.height / 2) * .18);
  }} onPointerLeave={() => { targetX.set(0); targetY.set(0); }}>
    <motion.div className="floating-target-orbit" style={{ x: reduce ? 0 : x, y: reduce ? 0 : y }}>
      <motion.svg viewBox="0 0 180 180" aria-hidden="true" animate={{ rotate: !reduce && inView ? [0, 360] : 0 }} transition={{ duration: !reduce && inView ? 24 : 0, ease: 'linear', repeat: !reduce && inView ? Infinity : 0 }}><defs><path id={id} d="M90,90 m-67,0 a67,67 0 1,1 134,0 a67,67 0 1,1 -134,0" /></defs><text><textPath href={`#${id}`} textLength="415">VIEW THE GALLERY · A LITTLE WONDER · </textPath></text></motion.svg>
      <motion.span className="floating-target-core" variants={{ rest: { scale: 1 }, hover: { scale: reduce ? 1 : 1.12 } }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} aria-hidden="true">✳</motion.span>
    </motion.div>
  </motion.a>;
}
