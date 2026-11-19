"use client";

import { useEffect, useRef } from "react";

type ConfettiPiece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  hue: number;
  size: number;
  shape: "rect" | "circle";
};

export default function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const pieces: ConfettiPiece[] = [];
    let frame = 0;
    let last = 0;

    const burst = (x: number, y: number) => {
      const count = 120;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.pow(Math.random(), 0.4) * 14 + 2;
        pieces.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          life: 40 + Math.random() * 60,
          age: 0,
          hue: 42 + Math.random() * 10,
          size: 4 + Math.random() * 6,
          shape: Math.random() > 0.5 ? "rect" : "circle",
        });
      }
      if (pieces.length > 900) pieces.splice(0, pieces.length - 900);
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(draw); }
    };

    const onConfetti = (event: CustomEvent) => {
      const { x, y } = (event.detail || {}) as { x?: number; y?: number };
      burst(x ?? window.innerWidth / 2, y ?? window.innerHeight / 2);
    };

    const draw = (time: number) => {
      const dt = Math.min((time - last) / 16.67 || 1, 2);
      last = time;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.25 * dt; // gravity
        p.vx *= 0.96;
        p.age += dt;

        const alpha = Math.pow(1 - p.age / p.life, 1.2);
        if (alpha <= 0) {
          pieces.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
        ctx.beginPath();
        if (p.shape === "rect") {
          ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      frame = pieces.length ? requestAnimationFrame(draw) : 0;
    };

    window.addEventListener("baji:confetti", onConfetti as EventListener);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("baji:confetti", onConfetti as EventListener);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}