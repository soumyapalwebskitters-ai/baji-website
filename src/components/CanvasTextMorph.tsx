"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  hue: number;
  size: number;
  baseX: number;
  baseY: number;
};

type State = "launch" | "explode" | "form" | "show";

export default function FirecrackerText({
  phrases = [
    "SMALL SPARKS.",
    "UNFORGETTABLE NIGHTS.",
    "BAJI MARKET · AFTER DARK",
    "OWN THE NIGHT.",
    "LIGHT · COLOUR · WONDER",
  ],
  displayTime = 3000,
}: {
  phrases?: string[];
  displayTime?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let particles: Particle[] = [];
    let state: State = "launch";
    let rocket: {
      x: number;
      y: number;
      targetY: number;
      trail: { x: number; y: number }[];
      active: boolean;
    } | null = {
      x: window.innerWidth / 2,
      y: window.innerHeight + 20,
      targetY: window.innerHeight * 0.28,
      trail: [],
      active: true,
    };
    let stateTimer = 0;
    let frame = 0;
    let last = 0;
    let currentText = phrases[0];

    function getTextPoints(text: string): { x: number; y: number }[] {
      const c = ctx!;
      c.save();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = "bold 64px Arial, Helvetica, sans-serif";
      const metrics = c.measureText(text);
      const tw = Math.ceil(metrics.width);
      const th = 80;

      const off = document.createElement("canvas");
      const octx = off.getContext("2d")!;
      off.width = tw + 20;
      off.height = th;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.font = "bold 64px Arial, Helvetica, sans-serif";
      octx.fillStyle = "#000";
      octx.fillText(text, (tw + 20) / 2, th / 2);

      const img = octx.getImageData(0, 0, tw + 20, th).data;
      const pts: { x: number; y: number }[] = [];
      const step = 3;
      for (let y = 0; y < th; y += step) {
        for (let x = 0; x < tw + 20; x += step) {
          const i = (y * (tw + 20) + x) * 4;
          if (img[i + 3] > 128) {
            pts.push({ x, y });
          }
        }
      }
      c.restore();
      return pts;
    }

    function burstParticles(originX: number, originY: number, targets: { x: number; y: number }[]) {
      particles = [];
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.30;

      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          tx: t.x,
          ty: t.y,
          hue: 42 + Math.random() * 10,
          size: 1.5 + Math.random() * 2.5,
          baseX: t.x,
          baseY: t.y,
        });
      }
      state = "explode";
      stateTimer = 0;
    }

    function startCycle() {
      idxRef.current = (idxRef.current + 1) % phrases.length;
      currentText = phrases[idxRef.current];
      const raw = getTextPoints(currentText);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.30;
      const targets = raw.map((p) => ({ x: cx + p.x - 10, y: cy + p.y }));

      if (state === "launch" && rocket) {
        burstParticles(rocket.x, rocket.y, targets);
      } else {
        burstParticles(window.innerWidth / 2, window.innerHeight * 0.30, targets);
      }
    }

    const draw = (time: number) => {
      const dt = Math.min((time - last) / 16.67 || 1, 2);
      last = time;
      stateTimer += dt;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Launch phase: firecracker rocket ascends
      if (state === "launch") {
        const r = rocket!;
        r.y -= 18 * dt;
        r.trail.unshift({ x: r.x, y: r.y });
        r.trail = r.trail.slice(0, 12);

        ctx.strokeStyle = "#fff3cb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.trail[r.trail.length - 1]?.x ?? r.x, r.trail[r.trail.length - 1]?.y ?? r.y);
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (r.y <= r.targetY) {
          const raw = getTextPoints(currentText);
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight * 0.30;
          const targets = raw.map((p) => ({ x: cx + p.x - 10, y: cy + p.y }));
          burstParticles(r.x, r.y, targets);
          rocket = null;
        }
      } else {
        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          if (state === "explode") {
            // Fly outward from explosion origin
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.15 * dt; // gravity
            p.vx *= 0.96;
            p.vy *= 0.96;

            // After burst settles, start forming text
            if (stateTimer > 450) {
              state = "form";
              stateTimer = 0;
            }
          } else if (state === "form") {
            // Ease toward text target
            const ease = 1 - Math.pow(1 - Math.min(stateTimer * 0.002, 1), 3);
            p.x += (p.tx - p.x) * ease * 0.12 * dt;
            p.y += (p.ty - p.y) * ease * 0.12 * dt;

            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            if (dx * dx + dy * dy < 4 && stateTimer > 600) {
              state = "show";
              stateTimer = 0;
            }
          } else if (state === "show") {
            // Hold at target with gentle drift
            p.x = p.tx + Math.sin(time * 0.002 + p.baseX * 0.015) * 1.5;
            p.y = p.ty + Math.cos(time * 0.0018 + p.baseY * 0.012) * 1.2;

            // After display time, explode text
            if (stateTimer > displayTime) {
              state = "explode";
              stateTimer = 0;
              particles.forEach((pp) => {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 3;
                pp.vx = Math.cos(angle) * speed;
                pp.vy = Math.sin(angle) * speed;
              });
            }
          }

          // Draw particle
          const alpha = state === "explode" ? Math.max(0, 1 - stateTimer / 800) : 1;
          ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 246, 222, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.35 * alpha, 0, Math.PI * 2);
          ctx.fill();

          // Cleanup dead particles after long explode
          if (state === "explode" && stateTimer > 1200 && alpha <= 0) {
            particles.splice(i, 1);
          }
        }

        // After explode settles and we have particles, auto-form next text
        if (state === "explode" && stateTimer > 900 && particles.length > 0) {
          const nextIdx = (idxRef.current + 1) % phrases.length;
          const raw = getTextPoints(phrases[nextIdx]);
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight * 0.30;
          const targets = raw.map((p) => ({ x: cx + p.x - 10, y: cy + p.y }));
          particles.forEach((p, i) => {
            const t = targets[i % targets.length];
            p.tx = t.x;
            p.ty = t.y;
            p.hue = 42 + Math.random() * 10;
          });
          state = "form";
          stateTimer = 0;
          idxRef.current = nextIdx;
          currentText = phrases[nextIdx];
        }
      }

      frame = requestAnimationFrame(draw);
    };

    last = performance.now();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [phrases, displayTime]);

  return (
    <canvas ref={canvasRef} className="firecracker-canvas" aria-hidden="true" />
  );
}