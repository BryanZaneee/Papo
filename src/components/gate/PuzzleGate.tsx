"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/constants";
import GateBackground from "./GateBackground";

interface PuzzleGateProps {
  onSolved: () => void;
}

const BAR_COUNT = 5;
const TARGET_HEIGHTS = [0.7, 0.4, 0.9, 0.3, 0.6]; // 0-1 normalized
const TOLERANCE = 0.1;
const BAR_COLORS = [COLORS.magenta, COLORS.cyan, COLORS.violet, COLORS.amber, COLORS.magenta];

export default function PuzzleGate({ onSolved }: PuzzleGateProps) {
  const [heights, setHeights] = useState<number[]>(Array(BAR_COUNT).fill(0.5));
  const [correctBars, setCorrectBars] = useState<boolean[]>(Array(BAR_COUNT).fill(false));
  const [solved, setSolved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);

  const checkSolution = useCallback(
    (newHeights: number[]) => {
      const newCorrect = newHeights.map(
        (h, i) => Math.abs(h - TARGET_HEIGHTS[i]) < TOLERANCE
      );
      setCorrectBars(newCorrect);

      if (newCorrect.every(Boolean)) {
        setSolved(true);
        setTimeout(onSolved, 1500);
      }
    },
    [onSolved]
  );

  const handlePointerDown = (index: number) => {
    draggingRef.current = index;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggingRef.current === null || !containerRef.current || solved) return;

      const rect = containerRef.current.getBoundingClientRect();
      const y = 1 - (e.clientY - rect.top) / rect.height;
      const clamped = Math.max(0.05, Math.min(0.95, y));

      setHeights((prev) => {
        const next = [...prev];
        next[draggingRef.current!] = clamped;
        checkSolution(next);
        return next;
      });
    };

    const handlePointerUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [checkSolution, solved]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      exit={{
        opacity: 0,
        scale: 1.5,
        filter: "blur(20px)",
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <GateBackground />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm tracking-[0.4em] text-foreground/40"
        >
          FREQUENCY LOCK
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-center font-mono text-xs text-foreground/25"
        >
          Drag the bars to unlock the frequency
        </motion.p>

        {/* Equalizer bars */}
        <div
          ref={containerRef}
          className="flex items-end gap-3 sm:gap-5"
          style={{ height: "300px", width: "fit-content" }}
        >
          {heights.map((h, i) => {
            const isCorrect = correctBars[i];
            const barColor = BAR_COLORS[i];
            const proximity = 1 - Math.abs(h - TARGET_HEIGHTS[i]);
            const glowIntensity = proximity * proximity;

            return (
              <motion.div
                key={i}
                onPointerDown={() => handlePointerDown(i)}
                className={cn(
                  "relative w-10 cursor-grab touch-none rounded-t-md sm:w-14",
                  isCorrect && "cursor-default"
                )}
                style={{
                  height: `${h * 100}%`,
                  backgroundColor: barColor,
                  boxShadow: isCorrect
                    ? `0 0 30px ${barColor}, 0 0 60px ${barColor}40`
                    : `0 0 ${glowIntensity * 20}px ${barColor}${Math.floor(glowIntensity * 60).toString(16).padStart(2, "0")}`,
                  transition: draggingRef.current === i ? "none" : "box-shadow 0.3s",
                }}
                animate={
                  solved
                    ? {
                        scaleY: [1, 1.3, 0],
                        opacity: [1, 1, 0],
                        transition: { delay: i * 0.1, duration: 0.6 },
                      }
                    : isCorrect
                      ? { scale: [1, 1.05, 1] }
                      : {}
                }
                transition={
                  isCorrect ? { duration: 0.6, repeat: Infinity } : undefined
                }
              >
                {/* Idle pulsing animation */}
                {!isCorrect && !solved && (
                  <motion.div
                    className="absolute inset-0 rounded-t-md"
                    style={{ backgroundColor: barColor }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 1.5 + i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Target indicator (subtle line) */}
                <div
                  className="pointer-events-none absolute left-0 right-0 h-[2px] opacity-20"
                  style={{
                    bottom: `${(TARGET_HEIGHTS[i] / h) * 100}%`,
                    backgroundColor: barColor,
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Status */}
        <motion.p
          className="font-mono text-xs tracking-wider"
          animate={{
            color: solved ? COLORS.cyan : "rgba(255,255,255,0.3)",
          }}
        >
          {solved
            ? "UNLOCKED"
            : `${correctBars.filter(Boolean).length}/${BAR_COUNT} MATCHED`}
        </motion.p>

        {/* Skip link */}
        {!solved && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            onClick={onSolved}
            className="mt-8 font-mono text-[10px] tracking-widest text-foreground/15 transition-colors hover:text-foreground/40"
          >
            SKIP
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
