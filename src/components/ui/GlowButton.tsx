"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: "pink" | "blue" | "lime";
}

const styles = {
  pink: "bg-pink text-ink shadow-[4px_4px_0_var(--lime)] hover:shadow-[6px_6px_0_var(--cream)]",
  blue: "bg-blue text-cream shadow-[4px_4px_0_var(--pink)] hover:shadow-[6px_6px_0_var(--cream)]",
  lime: "bg-lime text-ink shadow-[4px_4px_0_var(--blue)] hover:shadow-[6px_6px_0_var(--cream)]",
};

export default function GlowButton({
  children,
  className,
  onClick,
  href,
  variant = "pink",
}: GlowButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center px-8 py-3 font-display text-sm font-700 uppercase tracking-wider transition-all duration-150",
    styles[variant],
    className
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05, rotate: -1 }}
        whileTap={{ scale: 0.95 }}
        className={baseClasses}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, rotate: -1 }}
      whileTap={{ scale: 0.95 }}
      className={baseClasses}
    >
      {children}
    </motion.button>
  );
}
