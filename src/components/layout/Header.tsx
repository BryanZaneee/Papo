"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SITE, NAV_LINKS } from "@/lib/constants";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ink/90 backdrop-blur-md border-b-4 border-pink"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo — bold sticker style */}
        <a
          href="#"
          className="relative inline-block rotate-[-1deg] bg-pink px-4 py-1 font-display text-2xl font-800 tracking-[0.15em] text-ink transition-transform hover:rotate-[1deg] hover:scale-105"
        >
          {SITE.name}
        </a>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link, i) => {
            const colors = [
              "hover:bg-pink hover:text-ink",
              "hover:bg-lime hover:text-ink",
              "hover:bg-blue hover:text-cream",
              "hover:bg-orange hover:text-ink",
              "hover:bg-pink hover:text-ink",
            ];
            return (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 font-display text-sm font-700 uppercase tracking-wider text-cream/70 transition-all duration-150",
                  colors[i % colors.length]
                )}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Mobile Hamburger — thick lines */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-2 md:hidden"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
            className="block h-1 w-8 bg-pink"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            className="block h-1 w-8 bg-lime"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
            className="block h-1 w-8 bg-blue"
          />
        </button>

        {/* Mobile Menu — full screen poster */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ clipPath: "circle(0% at 95% 5%)" }}
              animate={{ clipPath: "circle(150% at 95% 5%)" }}
              exit={{ clipPath: "circle(0% at 95% 5%)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-ink md:hidden"
            >
              {/* Decorative dots */}
              <div className="pointer-events-none absolute inset-0 opacity-10 halftone text-pink" />

              {NAV_LINKS.map((link, i) => {
                const bgColors = ["bg-pink", "bg-lime", "bg-blue", "bg-orange", "bg-pink"];
                const textColors = ["text-ink", "text-ink", "text-cream", "text-ink", "text-ink"];
                return (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0, x: -40, rotate: -5 }}
                    animate={{ opacity: 1, x: 0, rotate: (i % 2 === 0 ? -2 : 2) }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      "px-8 py-3 font-display text-4xl font-800 uppercase tracking-wider transition-transform hover:scale-110",
                      bgColors[i % bgColors.length],
                      textColors[i % textColors.length]
                    )}
                  >
                    {link.label}
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
