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

const accentColors = ["text-pink", "text-lime", "text-blue", "text-orange", "text-pink"];

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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="absolute bottom-full left-0 right-0 mb-2 max-h-80 overflow-y-auto border-4 border-pink bg-ink/98 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b-2 border-cream/10 px-4 py-3">
            <span className="font-display text-xs font-700 uppercase tracking-widest text-pink">
              Tracklist
            </span>
            <button
              onClick={onClose}
              className="font-display text-xs font-700 uppercase text-cream/30 hover:text-cream"
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
                  "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-cream/5",
                  isActive && "bg-pink/10 border-l-4 border-pink"
                )}
              >
                <span className={cn("w-6 font-display text-sm font-700", accentColors[i % accentColors.length])}>
                  {isActive && isPlaying ? (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ▶
                    </motion.span>
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("truncate font-display text-sm font-600 uppercase", isActive ? "text-pink" : "text-cream/70")}>
                    {track.title}
                  </p>
                  {track.genre && (
                    <p className="font-hand text-xs text-cream/25">{track.genre}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-cream/20">{formatTime(track.duration)}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
