"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import RevealHeading from "@/components/RevealHeading";

const photos = [
  { src: 'https://drive.google.com/thumbnail?id=19SvPjOMKehcajqeYBRaJoCErGsfjLAxs&sz=w1920', title: 'A sky full of colour', description: 'Fireworks lighting up a New Year’s Eve sky.' },
  { src: 'https://drive.google.com/thumbnail?id=1EpckF7ngBxv10KIhJGeUFq4ZyDZ2ym56&sz=w1920', title: 'The golden hour, after dark', description: 'Golden sparks spreading into the night.' },
  { src: 'https://drive.google.com/thumbnail?id=1PDRX-w0knYyYerdwVeIBS0lSaKA5GAAU&sz=w1920', title: 'One more moment of wonder', description: 'A brilliant burst of fireworks against the darkness.' },
];
type Arrangement = 'grid' | 'fan' | 'focus';
export default function GalleryShowcase() {
  const [arrangement, setArrangement] = useState<Arrangement>('grid');
  const [active, setActive] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(1000);
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const reduce = useMotionPreference();
  const mobile = width < 650;
  const stageHeight = arrangement === 'grid' && mobile ? 780 : mobile ? 350 : 460;

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    setWidth(el.clientWidth); observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = dialog.current;
    if (selected !== null && el && !el.open) el.showModal();
    if (selected === null && el?.open) { el.close(); opener.current?.focus({ preventScroll: true }); }
  }, [selected]);
  function open(index: number, button: HTMLElement) { opener.current = button; setSelected(index); }
  function next(change: number) { setSelected(current => current === null ? null : (current + change + photos.length) % photos.length); }

  return <section id="gallery" className="gallery-section section container">
    <div className="section-heading" data-reveal><div><span className="eyebrow">THE CELEBRATION GALLERY</span><RevealHeading>Some moments<br /><em>deserve a closer look.</em></RevealHeading></div><p>A little light. A different perspective.<br />Explore the moments that inspire us.</p></div>
    <div className="gallery-toolbar"><div className="gallery-layouts" role="group" aria-label="Gallery arrangement">{(['grid', 'fan', 'focus'] as const).map(layout => <button type="button" key={layout} aria-pressed={arrangement === layout} onClick={() => setArrangement(layout)}>{arrangement === layout && <motion.span className="gallery-layout-highlight" layoutId="gallery-layout" transition={{ duration: reduce ? 0 : .3 }} />}<span>{layout === 'grid' ? 'Grid' : layout === 'fan' ? 'Fan' : 'Spotlight'}</span></button>)}</div><span className="gallery-hint">Select a photograph to explore</span></div>
    <motion.div ref={stage} className={`gallery-stage gallery-${arrangement}`} animate={{ height: stageHeight }} transition={{ duration: reduce ? 0 : .6 }}>
      {photos.map((photo, i) => {
        const cardWidth = arrangement === 'grid' ? (mobile ? width : (width - 40) / 3) : Math.min(width * (mobile ? .7 : .36), 440);
        const cardHeight = arrangement === 'grid' && mobile ? 244 : mobile ? 290 : 390;
        let x = arrangement === 'grid' ? mobile ? 0 : i * (cardWidth + 20) : (width - cardWidth) / 2;
        let y = arrangement === 'grid' && mobile ? i * 264 : 26;
        let rotate = 0, scale = 1;
        if (arrangement === 'fan') { x += (i - 1) * cardWidth * .36; y += Math.abs(i - 1) * 22; rotate = (i - 1) * 12; }
        if (arrangement === 'focus') { x += (i - active) * cardWidth * .78; scale = i === active ? 1 : .82; }
        return <motion.button key={photo.src} type="button" className="gallery-photo" aria-label={`Open photograph: ${photo.title}`} data-cursor-label="View" initial={false} animate={{ x, y, width: cardWidth, height: cardHeight, rotate, scale, opacity: arrangement === 'focus' && i !== active ? .48 : 1 }} style={{ zIndex: arrangement === 'focus' ? i === active ? 3 : 1 : i === 1 ? 3 : 2 }} transition={{ duration: reduce ? 0 : .65, ease: [.22, 1, .36, 1] }} whileHover={reduce ? undefined : { scale: scale * 1.025 }} onClick={event => open(i, event.currentTarget)}>
          <img src={photo.src} alt={photo.description} loading="lazy" /><span className="gallery-photo-caption">{photo.title}<span aria-hidden="true">＋</span></span>
        </motion.button>;
      })}
    </motion.div>
    {arrangement === 'focus' && <div className="gallery-navigation"><button type="button" aria-label="Previous spotlight photograph" onClick={() => setActive(i => (i + photos.length - 1) % photos.length)}>Previous</button><span aria-live="polite">{photos[active].title}</span><button type="button" aria-label="Next spotlight photograph" onClick={() => setActive(i => (i + 1) % photos.length)}>Next</button></div>}
    <dialog ref={dialog} className="gallery-dialog" aria-label="Celebration photograph" onCancel={event => { event.preventDefault(); setSelected(null); }} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); next(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); next(-1); }
    }} data-lenis-prevent>
      {selected !== null && <div className="gallery-dialog-inner"><button type="button" className="gallery-close" aria-label="Close photograph" onClick={() => setSelected(null)}>Close <span aria-hidden="true">×</span></button><AnimatePresence mode="wait" initial={false}><motion.figure key={selected} initial={{ opacity: 0, scale: reduce ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}><img src={photos[selected].src} alt={photos[selected].description} /><figcaption>{photos[selected].title}</figcaption></motion.figure></AnimatePresence><div className="gallery-dialog-controls"><button type="button" onClick={() => next(-1)} aria-label="Previous photograph">Previous</button><span aria-live="polite">{selected + 1} / {photos.length}</span><button type="button" onClick={() => next(1)} aria-label="Next photograph">Next</button></div></div>}
    </dialog>
  </section>;
}
