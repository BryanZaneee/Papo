"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { bio } from "@/data/site";
import { fadeInUp, slideInLeft, slideInRight } from "@/lib/animations";

export default function BioSection() {
  return (
    <SectionWrapper id="bio">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center justify-center"
        >
          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg bg-surface">
            {/* Placeholder for photo */}
            <div className="absolute inset-0 bg-gradient-to-b from-magenta/10 to-violet/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-foreground/20">Photo</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={slideInRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col justify-center"
        >
          <motion.h2
            variants={fadeInUp}
            className="mb-6 text-3xl font-bold tracking-tight md:text-4xl"
          >
            {bio.headline}
          </motion.h2>
          {bio.text.split("\n\n").map((para, i) => (
            <motion.p
              key={i}
              variants={fadeInUp}
              className="mb-4 text-base leading-relaxed text-foreground/60"
            >
              {para}
            </motion.p>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
