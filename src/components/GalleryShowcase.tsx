"use client";

import { useEffect, useRef, useState } from "react";
import MotionSlider from "./MotionSlider";
import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import RevealHeading from "@/components/RevealHeading";

const photos = [
  { src: 'https://drive.google.com/thumbnail?id=19SvPjOMKehcajqeYBRaJoCErGsfjLAxs&sz=w1920', title: 'A sky full of colour', description: 'Fireworks lighting up a New Year’s Eve sky.' },
  { src: 'https://drive.google.com/thumbnail?id=1EpckF7ngBxv10KIhJGeUFq4ZyDZ2ym56&sz=w1920', title: 'The golden hour, after dark', description: 'Golden sparks spreading into the night.' },
  { src: 'https://drive.google.com/thumbnail?id=1PDRX-w0knYyYerdwVeIBS0lSaKA5GAAU&sz=w1920', title: 'One more moment of wonder', description: 'A brilliant burst of fireworks against the darkness.' },
];
export default function GalleryShowcase() {
  const [direction, setDirection] = useState(1);
  const [active, setActive] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(1000);
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const reduce = useMotionPreference();
  const mobile = width < 650;
  const stageHeight = mobile ? 350 : 460;

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
  function next(change: number) { setDirection(change); setSelected(current => current === null ? null : (current + change + photos.length) % photos.length); }

  return <section id="gallery" className="gallery-section section container">
    <div className="section-heading" data-reveal><div><span className="eyebrow">THE CELEBRATION GALLERY</span><RevealHeading>Some moments<br /><em>deserve a closer look.</em></RevealHeading></div><p>A little light. A different perspective.<br />Explore the moments that inspire us.</p></div>
    <motion.div ref={stage} className="gallery-stage gallery-focus" animate={{ height: stageHeight }} transition={{ duration: reduce ? 0 : .6 }} style={{ touchAction: 'pan-y' }} onPanEnd={(_, info) => {
      if (Math.abs(info.offset.x) > 50) setActive(current => (current + (info.offset.x < 0 ? 1 : photos.length - 1)) % photos.length);
    }} onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); setActive(current => (current + (event.key === 'ArrowRight' ? 1 : photos.length - 1)) % photos.length); }
    }}>
      {photos.map((photo, i) => {
        const cardWidth = Math.min(width * (mobile ? .7 : .36), 440);
        const cardHeight = mobile ? 290 : 390;
        const offset = ((i - active + photos.length + 1) % photos.length) - 1;
        const x = (width - cardWidth) / 2 + offset * cardWidth * .78;
        const scale = i === active ? 1 : .82;
        return <motion.button key={photo.src} type="button" className="gallery-photo" aria-label={`${i === active ? 'Open' : 'Spotlight'} photograph: ${photo.title}`} data-cursor-label="View" initial={false} animate={{ x, y: 26, width: cardWidth, height: cardHeight, scale, opacity: i !== active ? .48 : 1 }} style={{ zIndex: i === active ? 3 : 1 }} transition={{ duration: reduce ? 0 : .65, ease: [.22, 1, .36, 1] }} whileHover={reduce ? undefined : { scale: scale * 1.025 }} onClick={event => { if (i !== active) setActive(i); else open(i, event.currentTarget); }}>
          <img draggable={false} src={photo.src} alt={photo.description} loading="lazy" /><span className="gallery-photo-caption">{photo.title}<span aria-hidden="true">＋</span></span>
        </motion.button>;
      })}
    </motion.div>
    <dialog ref={dialog} className="gallery-dialog" aria-label="Celebration photograph" onCancel={event => { event.preventDefault(); setSelected(null); }} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} onKeyDown={event => {
      if (event.defaultPrevented) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); next(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); next(-1); }
    }} data-lenis-prevent>
      {selected !== null && <div className="gallery-dialog-inner"><button type="button" className="gallery-close" aria-label="Close photograph" onClick={() => setSelected(null)}>Close <span aria-hidden="true">×</span></button><MotionSlider slideKey={selected} direction={direction} onMove={next}><figure><img draggable={false} src={photos[selected].src} alt={photos[selected].description} /><figcaption>{photos[selected].title}</figcaption></figure></MotionSlider><div className="gallery-dialog-controls"><span aria-live="polite">{selected + 1} / {photos.length}</span></div></div>}
    </dialog>
  </section>;
}
