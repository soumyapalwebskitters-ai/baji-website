"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";

export function RollingText({ text }: { text: string }) {
  const reduce = useMotionPreference();
  if (reduce) return <span>{text}</span>;
  return <><span className="sr-only">{text}</span><span className="rolling-label" aria-hidden="true">{Array.from(text).map((letter, i) => <span className="rolling-letter" key={i}>
    <motion.span className="rolling-letter-track" variants={{ rest: { y: '0%' }, hover: { y: '-50%' } }} transition={{ duration: .38, delay: i * .012, ease: [.22, 1, .36, 1] }}><span>{letter === ' ' ? '\u00a0' : letter}</span><span>{letter === ' ' ? '\u00a0' : letter}</span></motion.span>
  </span>)}</span></>;
}

export function RollingLink({ text, ...props }: Omit<HTMLMotionProps<'a'>, 'children'> & { text: string }) {
  const reduce = useMotionPreference();
  return <motion.a {...props} initial="rest" animate="rest" whileHover="hover" whileFocus="hover" whileTap={reduce ? undefined : { scale: .98 }}><RollingText text={text} /></motion.a>;
}
