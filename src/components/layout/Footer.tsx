"use client";

import { motion } from "framer-motion";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="border-t border-cream/10 bg-ink px-6 py-14"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        <span className="font-display text-2xl font-800 tracking-[0.2em] text-cream/8">
          {SITE.name}
        </span>

        <div className="flex flex-wrap justify-center gap-6">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-xs font-600 uppercase tracking-[0.15em] text-cream/25 transition-colors hover:text-pink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <p className="font-mono text-[10px] text-cream/15">
          &copy; {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </motion.footer>
  );
}
