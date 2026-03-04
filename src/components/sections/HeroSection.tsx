"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function HeroSection() {
  const letters = SITE.name.split("");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Vertical ruled lines — editorial grid feel */}
      <div className="pointer-events-none absolute inset-0 flex justify-between px-[10%] opacity-[0.04]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-full w-px bg-cream" />
        ))}
      </div>

      {/* Accent stripe */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-0 top-[38%] h-[2px] w-full origin-left bg-pink/30"
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* THE NAME */}
        <div className="flex items-baseline justify-center">
          {letters.map((letter, i) => (
            <motion.span
              key={`${letter}-${i}`}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.4 + i * 0.12,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block font-display text-[clamp(6rem,22vw,16rem)] font-800 leading-[0.8] tracking-tighter text-cream"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Tagline — clean, stark */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-pink" />
            <span className="font-display text-xs font-600 uppercase tracking-[0.4em] text-cream/40">
              {SITE.tagline}
            </span>
            <div className="h-px w-8 bg-pink" />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#music"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-24 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="20" height="32" viewBox="0 0 20 32" fill="none" stroke="var(--cream)" strokeWidth="1.5" className="opacity-20">
              <rect x="1" y="1" width="18" height="30" rx="9" />
              <motion.circle
                cx="10"
                cy="10"
                r="2"
                fill="var(--pink)"
                animate={{ cy: [8, 18, 8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>
        </motion.a>
      </div>
    </section>
  );
}
