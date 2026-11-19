"use client";

import { useMotionPreference } from "@/hooks/useMotionPreference";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { motion } from "framer-motion";

export default function RevealHeading({ children }: { children: ReactNode }) {
  const reduce = useMotionPreference();
  let character = 0;
  function split(nodes: ReactNode): ReactNode {
    return Children.map(nodes, node => {
      if (typeof node === 'string' || typeof node === 'number') {
        return String(node).split(/(\s+)/).map((word, wordIndex) => /^\s+$/.test(word) ? word :
          <span className="reveal-word" key={wordIndex}>{Array.from(word).map(letter => {
            const index = character++;
            return <motion.span className="reveal-char" key={index} variants={{ hidden: { opacity: 0, y: reduce ? 0 : '0.65em' }, visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : .55, delay: reduce ? 0 : Math.min(index * .012, .45), ease: [.22, 1, .36, 1] } } }}>{letter}</motion.span>;
          })}</span>);
      }
      if (isValidElement<{ children?: ReactNode }>(node) && node.props.children) return cloneElement(node, {}, split(node.props.children));
      return node;
    });
  }
  return <motion.h2 className="reveal-heading" initial={reduce ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: .2 }}><span className="sr-only">{children}</span><span aria-hidden="true">{split(children)}</span></motion.h2>;
}
