"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { bio } from "@/data/site";

export default function BioSection() {
  return (
    <SectionWrapper id="bio" accent="lime">
      <div className="grid gap-12 md:grid-cols-5 md:gap-20">
        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative md:col-span-2"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden border border-cream/10 bg-surface">
            <div className="absolute inset-0 bg-gradient-to-b from-pink/5 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs uppercase tracking-widest text-cream/10">Photo</span>
            </div>
          </div>
          {/* Accent bar */}
          <div className="absolute -bottom-2 -right-2 h-full w-1 bg-pink" />
        </motion.div>

        {/* Bio text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center md:col-span-3"
        >
          <div className="mb-8 flex items-end gap-4">
            <h2 className="font-display text-4xl font-800 uppercase tracking-tighter text-cream md:text-5xl">
              {bio.headline}
            </h2>
            <div className="mb-2 h-px flex-1 bg-cream/10" />
          </div>

          {bio.text.split("\n\n").map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="mb-5 font-display text-base font-400 leading-[1.9] text-cream/50"
            >
              {para}
            </motion.p>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
