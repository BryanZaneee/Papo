"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { contact } from "@/data/site";

export default function ContactSection() {
  const buttons = [
    { label: "Booking", email: contact.bookingEmail, bg: "bg-pink", shadow: "shadow-[4px_4px_0_var(--lime)]", rotate: "-rotate-1" },
    { label: "Press", email: contact.pressEmail, bg: "bg-blue", shadow: "shadow-[4px_4px_0_var(--pink)]", rotate: "rotate-1" },
    { label: "Management", email: contact.managementEmail, bg: "bg-lime", shadow: "shadow-[4px_4px_0_var(--blue)]", rotate: "-rotate-2" },
  ];

  return (
    <SectionWrapper id="contact" className="border-t-4 border-pink">
      <div className="flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
          viewport={{ once: true }}
          className="mb-4 inline-block bg-pink px-6 py-3 font-display text-4xl font-800 uppercase text-ink md:text-5xl"
        >
          {contact.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-16 font-hand text-xl text-cream/40 rotate-1 text-center"
        >
          {contact.note}
        </motion.p>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          {buttons.map((btn, i) => (
            <motion.a
              key={btn.label}
              href={`mailto:${btn.email}`}
              initial={{ opacity: 0, y: 20, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: parseInt(btn.rotate) || 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ rotate: 0, scale: 1.08, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.95 }}
              className={`${btn.bg} ${btn.shadow} ${btn.rotate} px-10 py-4 font-display text-lg font-800 uppercase tracking-wider text-ink transition-shadow hover:shadow-[6px_6px_0_var(--cream)]`}
            >
              {btn.label}
            </motion.a>
          ))}
        </div>

        {/* Decorative scribble */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <svg width="200" height="30" viewBox="0 0 200 30" className="text-cream/10">
            <path
              d="M5 15 Q 25 2, 45 15 Q 65 28, 85 15 Q 105 2, 125 15 Q 145 28, 165 15 Q 185 2, 195 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
