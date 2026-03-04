"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { tracks } from "@/data/tracks";

export default function MusicSection() {
  return (
    <SectionWrapper id="music" accent="pink">
      <div className="flex flex-col gap-10">
        {/* Section header */}
        <div className="flex items-end gap-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl font-800 uppercase tracking-tighter text-cream md:text-6xl"
          >
            Music
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="mb-3 h-px flex-1 origin-left bg-cream/10"
          />
        </div>

        {/* Track list */}
        <div className="grid gap-0 border-t border-cream/10">
          {tracks.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group flex cursor-pointer items-center gap-5 border-b border-cream/10 px-2 py-5 transition-colors hover:bg-cream/[0.03]"
            >
              <span className="font-mono text-xs text-cream/20 w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg font-700 uppercase tracking-wide text-cream/80 transition-colors group-hover:text-cream">
                  {track.title}
                </p>
              </div>
              {track.genre && (
                <span className="hidden font-mono text-[10px] uppercase tracking-widest text-cream/20 sm:block">
                  {track.genre}
                </span>
              )}
              <span className="font-mono text-xs text-cream/20">
                {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
              </span>
              <div className="w-6 text-cream/0 transition-colors group-hover:text-pink">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
