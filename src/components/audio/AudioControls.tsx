"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
}

export default function AudioControls({
  isPlaying,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
}: AudioControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onSkipPrev}
        className="text-foreground/40 transition-colors hover:text-foreground"
        aria-label="Previous track"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
        </svg>
      </button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onTogglePlay}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
          isPlaying
            ? "border-cyan text-cyan"
            : "border-foreground/30 text-foreground/60 hover:border-foreground hover:text-foreground"
        )}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </motion.button>

      <button
        onClick={onSkipNext}
        className="text-foreground/40 transition-colors hover:text-foreground"
        aria-label="Next track"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
    </div>
  );
}
