"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: "magenta" | "cyan" | "violet";
}

const glowColors = {
  magenta: "shadow-magenta-glow hover:shadow-[0_0_30px_var(--magenta-glow)] border-magenta/40 hover:border-magenta",
  cyan: "shadow-cyan-glow hover:shadow-[0_0_30px_var(--cyan-glow)] border-cyan/40 hover:border-cyan",
  violet: "shadow-violet-glow hover:shadow-[0_0_30px_var(--violet-glow)] border-violet/40 hover:border-violet",
};

export default function GlowButton({
  children,
  className,
  onClick,
  href,
  variant = "cyan",
}: GlowButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-full border px-8 py-3 text-sm font-medium tracking-wider text-foreground transition-all duration-300",
    glowColors[variant],
    className
  );

  const inner = (
    <motion.span
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={baseClasses}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <button onClick={onClick}>{inner}</button>;
}
