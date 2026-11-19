"use client";

import { useMotionPreference } from "@/hooks/useMotionPreference";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function ScrollProgress() {
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, restDelta: .001 });
  return <motion.div className="reading-progress" aria-hidden="true" style={{ scaleX: reduce ? scrollYProgress : progress }} />;
}

export function ScrollPhoto({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-22, 22]);
  return <motion.img ref={ref} src={src} alt={alt} loading="lazy" className="scroll-photo" style={{ y: reduce ? 0 : y, scale: reduce ? 1 : 1.12 }} />;
}
