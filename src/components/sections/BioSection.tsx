"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { bio } from "@/data/site";

export default function BioSection() {
  return (
    <SectionWrapper id="bio" accent="lime">
      <div className="grid gap-12 md:grid-cols-5 md:gap-16">
        {/* Photo — tilted, tape decoration */}
        <motion.div
          initial={{ opacity: 0, rotate: -8, scale: 0.9 }}
          whileInView={{ opacity: 1, rotate: -3, scale: 1 }}
          viewport={{ once: true }}
          className="relative md:col-span-2"
        >
          {/* Tape strips */}
          <div className="absolute -top-3 left-[20%] z-10 h-4 w-16 rotate-[-8deg] bg-cream/15" />
          <div className="absolute -top-2 right-[15%] z-10 h-4 w-14 rotate-[5deg] bg-cream/10" />

          <div className="relative aspect-[3/4] w-full overflow-hidden border-4 border-cream/20 bg-surface">
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-blue/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-hand text-2xl text-cream/15">photo here</span>
            </div>
          </div>

          {/* Hand-written label under photo */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-3 text-center font-hand text-lg text-pink rotate-2"
          >
            the one and only ^
          </motion.p>
        </motion.div>

        {/* Bio text — editorial layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center md:col-span-3"
        >
          <motion.h2
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-8 inline-block"
          >
            <span className="bg-lime px-4 py-1 font-display text-3xl font-800 uppercase text-ink md:text-4xl">
              {bio.headline}
            </span>
          </motion.h2>

          {bio.text.split("\n\n").map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="mb-6 font-display text-base font-400 leading-[1.8] text-cream/60"
            >
              {para}
            </motion.p>
          ))}

          {/* Decorative squiggle */}
          <svg width="120" height="20" viewBox="0 0 120 20" className="mt-4 text-orange opacity-40">
            <path
              d="M2 10 Q 10 2, 20 10 Q 30 18, 40 10 Q 50 2, 60 10 Q 70 18, 80 10 Q 90 2, 100 10 Q 110 18, 118 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
