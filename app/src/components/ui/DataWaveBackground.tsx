"use client";

import { useEffect, useRef } from "react";

const COLS = 90;
const ROWS = 42;
const GOLD_CHANCE = 0.04;

/**
 * A dense field of small dots forming rolling dune-like waves, receding
 * toward a horizon near the top — brand-blue with a few warm gold flecks.
 * Pure canvas, no dependencies.
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
    const warningHsl = getComputedStyle(document.documentElement).getPropertyValue("--warning").trim();
    const canvasHsl = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();

    let width = 0;
    let height = 0;
    let horizonY = 0;
    let frame = 0;
    let time = 0;
    let goldMask: boolean[][] = [];

    function resize() {
      const rect = parent!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      horizonY = height * 0.12;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      goldMask = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => Math.random() < GOLD_CHANCE)
      );
    }

    function draw() {
      ctx!.fillStyle = `hsl(${canvasHsl})`;
      ctx!.fillRect(0, 0, width, height);

      for (let row = 0; row < ROWS; row++) {
        const rowFrac = row / (ROWS - 1);
        const depth = Math.pow(rowFrac, 1.6);
        const baseY = horizonY + (height - horizonY) * depth;
        const size = 0.5 + depth * 3;
        const depthBrightness = 0.15 + depth * 0.55;

        for (let col = 0; col < COLS; col++) {
          const colFrac = col / (COLS - 1);
          const x = colFrac * width;

          const w =
            Math.sin(colFrac * 6 + rowFrac * 2 + time * 0.012) * 0.5 +
            Math.sin(colFrac * 3 - rowFrac * 4 - time * 0.008) * 0.3 +
            Math.sin(rowFrac * 8 + time * 0.006) * 0.2;

          const y = baseY + w * (4 + depth * 14);
          const shade = 0.55 + 0.45 * ((w + 1) / 2);
          const brightness = Math.min(1, depthBrightness * shade);

          const isGold = goldMask[row]?.[col] ?? false;
          ctx!.fillStyle = isGold
            ? `hsl(${warningHsl} / ${(brightness * 0.9).toFixed(2)})`
            : `hsl(${brandHsl} / ${brightness.toFixed(2)})`;

          const dotSize = isGold ? size * 1.2 : size;
          ctx!.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
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
