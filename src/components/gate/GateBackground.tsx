"use client";

import { useEffect, useRef } from "react";
import { COLORS } from "@/lib/constants";

export default function GateBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const lines: { x: number; speed: number; color: string; alpha: number }[] = [];
    const colors = [COLORS.magenta, COLORS.cyan, COLORS.violet];

    for (let i = 0; i < 30; i++) {
      lines.push({
        x: Math.random() * window.innerWidth,
        speed: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.15 + 0.03,
      });
    }

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const line of lines) {
        line.x += line.speed;
        if (line.x > w + 2) line.x = -2;

        ctx.beginPath();
        ctx.moveTo(line.x, 0);
        ctx.lineTo(line.x, h);
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = line.alpha;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
