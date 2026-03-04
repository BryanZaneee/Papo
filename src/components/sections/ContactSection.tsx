"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import GlowButton from "@/components/ui/GlowButton";
import { contact } from "@/data/site";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function ContactSection() {
  return (
    <SectionWrapper id="contact" className="border-t border-border">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col items-center text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
        >
          {contact.headline}
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mb-12 max-w-md font-mono text-sm text-foreground/40"
        >
          {contact.note}
        </motion.p>

        <motion.div
          variants={staggerContainer}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <motion.div variants={fadeInUp}>
            <GlowButton
              variant="magenta"
              href={`mailto:${contact.bookingEmail}`}
            >
              Booking
            </GlowButton>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <GlowButton
              variant="cyan"
              href={`mailto:${contact.pressEmail}`}
            >
              Press
            </GlowButton>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <GlowButton
              variant="violet"
              href={`mailto:${contact.managementEmail}`}
            >
              Management
            </GlowButton>
          </motion.div>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
