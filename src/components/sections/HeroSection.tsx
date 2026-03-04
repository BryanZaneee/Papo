"use client";

import { motion } from "framer-motion";
import AnimatedText from "@/components/ui/AnimatedText";
import ParticleField from "@/components/ui/ParticleField";
import GradientBlob from "@/components/ui/GradientBlob";
import { SITE } from "@/lib/constants";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <ParticleField className="opacity-60" />
      <GradientBlob color="magenta" size="lg" className="-left-32 -top-32" />
      <GradientBlob color="violet" size="lg" className="-bottom-32 -right-32" />
      <GradientBlob color="cyan" size="md" className="left-1/2 top-1/3" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <AnimatedText
          text={SITE.name}
          className="text-7xl font-bold tracking-[0.3em] sm:text-8xl md:text-9xl"
          delay={0.2}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-sm tracking-[0.5em] text-foreground/40"
        >
          {SITE.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-12"
        >
          <motion.a
            href="#music"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block text-foreground/20"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
