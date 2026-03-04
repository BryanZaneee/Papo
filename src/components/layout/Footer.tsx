"use client";

import { motion } from "framer-motion";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { fadeInUp } from "@/lib/animations";

export default function Footer() {
  return (
    <motion.footer
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="border-t border-border bg-background px-6 py-12"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        <div className="flex gap-6">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-wider text-foreground/40 transition-colors hover:text-cyan"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="font-mono text-xs text-foreground/30">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
