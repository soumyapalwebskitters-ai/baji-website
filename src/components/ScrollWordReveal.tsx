"use client";

import { useWebContent } from "./WebContentProvider";
import { Fragment, useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import FloatingTarget from "@/components/FloatingTarget";


function Word({ word, index, count, progress, reduce }: { word: string; index: number; count: number; progress: MotionValue<number>; reduce: boolean }) {
  const start = index / count * .8;
  const opacity = useTransform(progress, [start, start + .2], [.18, 1]);
  return <motion.span className="scroll-reveal-word" aria-hidden="true" style={{ opacity: reduce ? 1 : opacity }}>{word}</motion.span>;
}
export default function ScrollWordReveal() {
  const { copy } = useWebContent();
  const ref = useRef<HTMLElement>(null);
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 85%'] });
  const statement = copy("reveal.statement");
  const words = statement.split(' ');
  return <section ref={ref} className="word-reveal-section" aria-label="A little wonder">
    <div className="word-reveal-stage container"><div className="word-reveal-copy"><span className="eyebrow">{copy("ScrollWordReveal.1")}</span><p className="word-reveal-statement"><span className="sr-only">{statement}</span>{words.map((word, index) => <Fragment key={index}><Word word={word} index={index} count={words.length} progress={scrollYProgress} reduce={reduce} />{' '}</Fragment>)}</p></div><FloatingTarget /></div>
  </section>;
}
