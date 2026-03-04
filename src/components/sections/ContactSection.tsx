"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { contact } from "@/data/site";

export default function ContactSection() {
  const buttons = [
    { label: "Booking", email: contact.bookingEmail, accent: "hover:bg-pink hover:text-ink" },
    { label: "Press", email: contact.pressEmail, accent: "hover:bg-lime hover:text-ink" },
    { label: "Management", email: contact.managementEmail, accent: "hover:bg-blue hover:text-cream" },
  ];

  return (
    <SectionWrapper id="contact" className="border-t border-cream/10">
      <div className="flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 font-display text-5xl font-800 uppercase tracking-tighter text-cream md:text-6xl"
        >
          {contact.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-14 font-display text-sm font-400 text-cream/30 text-center max-w-md"
        >
          {contact.note}
        </motion.p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {buttons.map((btn, i) => (
            <motion.a
              key={btn.label}
              href={`mailto:${btn.email}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`border border-cream/15 px-10 py-4 font-display text-sm font-700 uppercase tracking-[0.15em] text-cream/60 transition-all duration-200 ${btn.accent}`}
            >
              {btn.label}
            </motion.a>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
