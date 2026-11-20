'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CustomCursor from './CustomCursor';
import SparkleCursor from './SparkleCursor';

export default function CursorEffects() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const update = () => {
      const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog:modal');
      setTarget(dialogs[dialogs.length - 1] || document.body);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, []);
  // Modal dialogs occupy the browser top layer, above any document z-index.
  return target ? createPortal(<><SparkleCursor /><CustomCursor /></>, target) : null;
}
