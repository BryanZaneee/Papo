"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import AudioControls from "./AudioControls";
import AudioWaveform from "./AudioWaveform";
import TrackList from "./TrackList";
import { tracks } from "@/data/tracks";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const [showTrackList, setShowTrackList] = useState(false);
  const player = useAudioPlayer(tracks);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-cream/10 bg-ink/95 backdrop-blur-md"
      >
        <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <TrackList
            tracks={tracks}
            currentTrack={player.currentTrack}
            isPlaying={player.isPlaying}
            isOpen={showTrackList}
            onTrackSelect={(track) => {
              player.playTrack(track);
              setShowTrackList(false);
            }}
            onClose={() => setShowTrackList(false)}
          />

          <button
            onClick={() => setShowTrackList(!showTrackList)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left sm:flex-none sm:w-48"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-cream/10 bg-surface">
              <svg className="h-3.5 w-3.5 text-pink" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-600 uppercase tracking-wide text-cream/70">
                {player.currentTrack?.title || "Select a track"}
              </p>
              <p className="truncate font-mono text-[10px] text-cream/25">
                {player.currentTrack?.artist || ""}
              </p>
            </div>
          </button>

          <AudioControls
            isPlaying={player.isPlaying}
            onTogglePlay={player.togglePlay}
            onSkipNext={player.skipNext}
            onSkipPrev={player.skipPrev}
          />

          <div className="hidden flex-1 items-center gap-2 sm:flex">
            <span className="font-mono text-[10px] text-cream/25 w-8 text-right">
              {formatTime(player.currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={player.duration || 100}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              className="h-[2px] flex-1 cursor-pointer appearance-none bg-cream/10 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink"
            />
            <span className="font-mono text-[10px] text-cream/25 w-8">
              {formatTime(player.duration)}
            </span>
          </div>

          <div className="hidden lg:block">
            <AudioWaveform analyser={player.analyser} isPlaying={player.isPlaying} />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-cream/20">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={player.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="h-[2px] w-16 cursor-pointer appearance-none bg-cream/10 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cream/30"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
