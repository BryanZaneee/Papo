"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Track } from "@/types";
import { cn } from "@/lib/utils";

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isOpen: boolean;
  onTrackSelect: (track: Track) => void;
  onClose: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TrackList({
  tracks,
  currentTrack,
  isPlaying,
  isOpen,
  onTrackSelect,
  onClose,
}: TrackListProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-full left-0 right-0 mb-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-mono text-xs tracking-wider text-foreground/40">
              TRACKLIST
            </span>
            <button
              onClick={onClose}
              className="font-mono text-xs text-foreground/30 hover:text-foreground"
            >
              CLOSE
            </button>
          </div>
          {tracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                onClick={() => onTrackSelect(track)}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-light",
                  isActive && "bg-surface-light"
                )}
              >
                <span className="w-6 font-mono text-xs text-foreground/20">
                  {isActive && isPlaying ? (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-cyan"
                    >
                      ▶
                    </motion.span>
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "truncate text-sm",
                      isActive ? "text-cyan" : "text-foreground/70"
                    )}
                  >
                    {track.title}
                  </p>
                  {track.genre && (
                    <p className="font-mono text-[10px] text-foreground/25">{track.genre}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-foreground/20">
                  {formatTime(track.duration)}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
