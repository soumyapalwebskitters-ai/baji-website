"use client";

import { useEffect, useRef } from "react";

type Sparkle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  hue: number;
  size: number;
};

export default function SparkleCursor() {
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

    const sparkles: Sparkle[] = [];
    let frame = 0;
    let last = 0;
    let mx = 0;
    let my = 0;

    const onMove = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      // Emit a burst of sparkles on move
      for (let i = 0; i < 3; i++) {
        sparkles.push({
          x: mx,
          y: my,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          life: 30 + Math.random() * 40,
          age: 0,
          hue: 42 + Math.random() * 10, // warm gold range
          size: 1.5 + Math.random() * 2.5,
        });
      }
      sparkles.splice(0, Math.max(0, sparkles.length - 150));
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(draw); }
    };

    const draw = (time: number) => {
      const dt = Math.min((time - last) / 16.67 || 1, 2);
      last = time;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const p = sparkles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.15 * dt; // gravity
        p.vx *= 0.96;
        p.age += dt;

        const alpha = Math.pow(Math.max(0, 1 - p.age / p.life), 1.2);
        if (alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Glow core
        ctx.fillStyle = `rgba(255, 246, 222, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4 * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      frame = sparkles.length ? requestAnimationFrame(draw) : 0;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    window.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        sparkles.length = 0;
      }
    });

    last = performance.now();
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="sparkle-cursor" aria-hidden="true" />;
}