"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { tracks } from "@/data/tracks";

export default function MusicSection() {
  return (
    <SectionWrapper id="music" accent="pink">
      <div className="flex flex-col gap-12">
        {/* Section title — zine style */}
        <div className="flex items-center gap-4">
          <motion.h2
            initial={{ opacity: 0, x: -30, rotate: -3 }}
            whileInView={{ opacity: 1, x: 0, rotate: -2 }}
            viewport={{ once: true }}
            className="inline-block bg-pink px-5 py-2 font-display text-4xl font-800 uppercase tracking-tight text-ink md:text-5xl"
          >
            Music
          </motion.h2>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="font-hand text-xl text-pink rotate-3"
          >
            latest heat!
          </motion.span>
        </div>

        {/* Track list — poster/zine style */}
        <div className="grid gap-3">
          {tracks.map((track, i) => {
            const accents = ["border-pink", "border-lime", "border-blue", "border-orange", "border-pink"];
            const bgHovers = ["hover:bg-pink/10", "hover:bg-lime/10", "hover:bg-blue/10", "hover:bg-orange/10", "hover:bg-pink/10"];
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`group flex items-center gap-4 border-l-4 ${accents[i % accents.length]} bg-surface/50 px-5 py-4 transition-colors ${bgHovers[i % bgHovers.length]} cursor-pointer`}
              >
                <span className="font-display text-3xl font-800 text-cream/15 transition-colors group-hover:text-cream/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg font-700 uppercase tracking-wide truncate">
                    {track.title}
                  </p>
                  {track.genre && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
                      {track.genre}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-cream/25">
                  {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
                </span>
                <svg
                  className="h-6 w-6 text-cream/20 transition-colors group-hover:text-pink"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-hand text-base text-cream/30 text-center rotate-1"
        >
          use the player bar at the bottom to listen
        </motion.p>
      </div>
    </SectionWrapper>
  );
}
