"use client";

import { useEffect, useRef } from "react";
import { COLORS } from "@/lib/constants";

interface AudioWaveformProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export default function AudioWaveform({ analyser, isPlaying }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = w / bufferLength;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;
          const hue = (i / bufferLength) * 180 + 180; // cyan to magenta
          ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
          ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
        }
      } else {
        // Idle animation — subtle bars
        const barCount = 32;
        const barWidth = w / barCount;
        const time = Date.now() / 1000;

        for (let i = 0; i < barCount; i++) {
          const barHeight = (Math.sin(time * 2 + i * 0.3) * 0.3 + 0.3) * h * 0.4;
          ctx.fillStyle = `${COLORS.cyan}20`;
          ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="h-8 w-24 sm:w-32"
    />
  );
}
