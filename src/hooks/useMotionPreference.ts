"use client";

import { useSyncExternalStore } from "react";

const query = '(prefers-reduced-motion: reduce)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Keep Framer Motion settings in sync when the OS preference changes live. */
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
