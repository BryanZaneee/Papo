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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full left-0 right-0 mb-1 max-h-80 overflow-y-auto border border-cream/10 bg-ink/98 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-cream/10 px-4 py-3">
            <span className="font-display text-[10px] font-700 uppercase tracking-[0.2em] text-cream/30">
              Tracklist
            </span>
            <button
              onClick={onClose}
              className="font-display text-[10px] font-600 uppercase tracking-wider text-cream/20 hover:text-cream"
            >
              Close
            </button>
          </div>
          {tracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                onClick={() => onTrackSelect(track)}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-cream/[0.03]",
                  isActive && "bg-pink/5 border-l-2 border-pink"
                )}
              >
                <span className={cn("w-5 font-mono text-[10px]", isActive ? "text-pink" : "text-cream/20")}>
                  {isActive && isPlaying ? (
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      ▶
                    </motion.span>
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("truncate font-display text-sm font-600 uppercase tracking-wide", isActive ? "text-pink" : "text-cream/60")}>
                    {track.title}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-cream/15">{formatTime(track.duration)}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
