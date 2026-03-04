"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function HeroSection() {
  const letters = SITE.name.split("");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background halftone pattern */}
      <div className="pointer-events-none absolute inset-0 halftone text-pink opacity-[0.03]" />

      {/* Giant diagonal stripe accents */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-0 top-[20%] h-24 w-full -rotate-6 bg-pink/10"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute right-0 top-[45%] h-16 w-full rotate-3 bg-lime/8"
      />
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-0 bottom-[25%] h-20 w-full -rotate-2 bg-blue/10"
      />

      {/* Scattered decorative elements */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute left-[10%] top-[15%] text-pink opacity-20"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M40 5L48 30H75L53 48L60 75L40 58L20 75L27 48L5 30H32Z" />
        </svg>
      </motion.div>
      <motion.div
        animate={{ rotate: [0, -360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute right-[15%] bottom-[20%] text-lime opacity-15"
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="30" cy="30" r="27" />
          <line x1="30" y1="3" x2="30" y2="57" />
          <line x1="3" y1="30" x2="57" y2="30" />
        </svg>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Hand-written annotation above */}
        <motion.span
          initial={{ opacity: 0, rotate: -8, y: 20 }}
          animate={{ opacity: 1, rotate: -5, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-hand text-2xl text-pink sm:text-3xl"
        >
          presenting...
        </motion.span>

        {/* THE NAME — massive, bold, stacked */}
        <div className="flex flex-wrap justify-center">
          {letters.map((letter, i) => (
            <motion.span
              key={`${letter}-${i}`}
              initial={{ opacity: 0, y: 80, rotate: -10 + Math.random() * 20 }}
              animate={{ opacity: 1, y: 0, rotate: (i % 2 === 0 ? -2 : 3) }}
              transition={{
                delay: 0.8 + i * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block font-display text-[clamp(5rem,20vw,14rem)] font-800 leading-[0.85] tracking-tight"
              style={{
                color: i === 0 ? "var(--pink)" : i === 1 ? "var(--lime)" : i === 2 ? "var(--blue)" : "var(--orange)",
                textShadow: "4px 4px 0 rgba(0,0,0,0.3)",
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Tagline — like a hand-stuck label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 3 }}
          animate={{ opacity: 1, scale: 1, rotate: 2 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-4 rotate-2 bg-cream px-6 py-2"
        >
          <span className="font-display text-sm font-700 uppercase tracking-[0.3em] text-ink">
            {SITE.tagline}
          </span>
        </motion.div>

        {/* Scroll indicator — hand-drawn arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mt-16"
        >
          <motion.a
            href="#music"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-hand text-lg text-cream/40">scroll down!</span>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--pink)" strokeWidth="3" strokeLinecap="round">
              <path d="M8 12 L16 24 L24 12" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
