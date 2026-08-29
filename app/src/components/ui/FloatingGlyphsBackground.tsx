"use client";

import { useEffect, useRef } from "react";

const GLYPHS = ["<", ">", "(", ")", "[", "]", "{", "}"];
const GLYPH_COUNT = 18;

interface Glyph {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  phase: number;
}

export function FloatingGlyphsBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const brandHsl = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
    const canvasHsl = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();

    let width = 0;
    let height = 0;
    let glyphs: Glyph[] = [];
    let frame = 0;
    let time = 0;

    function resize() {
      const rect = parent!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      glyphs = Array.from({ length: GLYPH_COUNT }, () => ({
        char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: 28 + Math.random() * 64,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.002,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx!.fillStyle = `hsl(${canvasHsl})`;
      ctx!.fillRect(0, 0, width, height);
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      for (const g of glyphs) {
        g.x += g.vx;
        g.y += g.vy;
        g.rotation += g.rotationSpeed;

        const margin = g.size;
        if (g.x < -margin) g.x = width + margin;
        if (g.x > width + margin) g.x = -margin;
        if (g.y < -margin) g.y = height + margin;
        if (g.y > height + margin) g.y = -margin;

        const breathe = 0.18 + 0.14 * (0.5 + 0.5 * Math.sin(time * 0.015 + g.phase));

        ctx!.save();
        ctx!.translate(g.x, g.y);
        ctx!.rotate(g.rotation);
        ctx!.font = `${g.size}px monospace`;
        ctx!.fillStyle = `hsl(${brandHsl} / ${breathe.toFixed(2)})`;
        ctx!.fillText(g.char, 0, 0);
        ctx!.restore();
      }

      time += 1;
    }

    function loop() {
      draw();
      frame = requestAnimationFrame(loop);
    }

    resize();

    if (reduceMotion) {
      draw();
    } else {
      loop();
    }

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true" />;
}
