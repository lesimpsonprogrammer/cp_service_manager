"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01{}[]<>/\\+-=";
const ROWS = 22;
const COLS = 40;

interface SkyGlyph {
  x: number;
  y: number;
  speed: number;
  char: string;
  twinklePhase: number;
}

/**
 * A perspective "sea" of data glyphs: a wavy grid mesh with glowing nodes
 * receding toward a horizon, plus a sky of slowly drifting, twinkling
 * characters above it. Brand-colored, canvas-based, no new dependencies.
 */
export function DataWaveBackground({ className = "" }: { className?: string }) {
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
    let frame = 0;
    let time = 0;
    let sky: SkyGlyph[] = [];

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

      sky = Array.from({ length: 70 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.55,
        speed: 0.15 + Math.random() * 0.3,
        char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx!.fillStyle = `hsl(${canvasHsl})`;
      ctx!.fillRect(0, 0, width, height);

      ctx!.font = "13px monospace";
      for (const p of sky) {
        p.y += p.speed;
        if (p.y > height * 0.6) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        const twinkle = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.05 + p.twinklePhase));
        ctx!.fillStyle = `hsl(${brandHsl} / ${twinkle.toFixed(2)})`;
        ctx!.fillText(p.char, p.x, p.y);
      }

      const horizonY = height * 0.42;
      const focal = 60;
      const points: { sx: number; sy: number }[][] = [];

      for (let row = 0; row < ROWS; row++) {
        const scale = focal / (ROWS + focal - row);
        const rowPoints: { sx: number; sy: number }[] = [];
        for (let col = 0; col < COLS; col++) {
          const worldX = (col - COLS / 2) * 1.4;
          const wave =
            Math.sin(col * 0.35 + time * 0.03 + row * 0.12) * (0.4 + row * 0.08) +
            Math.sin(row * 0.25 - time * 0.02) * 0.6;
          const sx = width / 2 + worldX * scale * 14;
          const sy = horizonY + (row / ROWS) * (height - horizonY) + wave * scale * 6;
          rowPoints.push({ sx, sy });
        }
        points.push(rowPoints);
      }

      for (let row = 0; row < ROWS; row++) {
        const alpha = Math.min(0.5, 0.05 + (row / ROWS) * 0.4);
        ctx!.strokeStyle = `hsl(${brandHsl} / ${alpha.toFixed(2)})`;
        ctx!.lineWidth = 1;
        for (let col = 0; col < COLS; col++) {
          const p = points[row]![col]!;
          if (col < COLS - 1) {
            const right = points[row]![col + 1]!;
            ctx!.beginPath();
            ctx!.moveTo(p.sx, p.sy);
            ctx!.lineTo(right.sx, right.sy);
            ctx!.stroke();
          }
          if (row < ROWS - 1) {
            const below = points[row + 1]![col]!;
            ctx!.beginPath();
            ctx!.moveTo(p.sx, p.sy);
            ctx!.lineTo(below.sx, below.sy);
            ctx!.stroke();
          }
        }
      }

      for (let row = 0; row < ROWS; row++) {
        const brightness = Math.min(1, 0.15 + (row / ROWS) * 0.9);
        const radius = 0.6 + (row / ROWS) * 1.8;
        ctx!.fillStyle = `hsl(${brandHsl} / ${brightness.toFixed(2)})`;
        for (let col = 0; col < COLS; col += 2) {
          const p = points[row]![col]!;
          ctx!.beginPath();
          ctx!.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
          ctx!.fill();
        }
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
