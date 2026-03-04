"use client";

import SectionWrapper from "@/components/layout/SectionWrapper";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function MusicSection() {
  return (
    <SectionWrapper id="music">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col items-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
        >
          Music
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mb-12 font-mono text-sm text-foreground/40"
        >
          Latest releases and mixes
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="w-full rounded-xl border border-border bg-surface/50 p-8 text-center"
        >
          <p className="font-mono text-sm text-foreground/30">
            Audio player loads with tracks — see bottom bar
          </p>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
