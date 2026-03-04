"use client";

import { motion } from "framer-motion";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  const colors = ["text-pink", "text-lime", "text-blue", "text-orange"];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative border-t-4 border-cream/10 bg-ink px-6 py-16 overflow-hidden"
    >
      {/* Background halftone */}
      <div className="pointer-events-none absolute inset-0 halftone text-pink opacity-[0.02]" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8">
        {/* Logo repeat */}
        <span className="font-display text-3xl font-800 tracking-[0.15em] text-cream/10">
          {SITE.name}
        </span>

        {/* Social links — sticker style */}
        <div className="flex flex-wrap justify-center gap-3">
          {SOCIAL_LINKS.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, rotate: [-2, 2, 0], transition: { duration: 0.2 } }}
              className={`border-2 border-current px-4 py-1.5 font-display text-xs font-700 uppercase tracking-wider transition-colors ${colors[i % colors.length]} hover:bg-current hover:text-ink`}
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        <p className="font-hand text-sm text-cream/20">
          &copy; {new Date().getFullYear()} {SITE.name} &mdash; all rights reserved
        </p>
      </div>
    </motion.footer>
  );
}
