"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientBlobProps {
  className?: string;
  color?: "magenta" | "cyan" | "violet";
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-48 w-48",
  md: "h-72 w-72",
  lg: "h-96 w-96",
};

const colorMap = {
  magenta: "bg-magenta/20",
  cyan: "bg-cyan/20",
  violet: "bg-violet/20",
};

export default function GradientBlob({
  className,
  color = "magenta",
  size = "md",
}: GradientBlobProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
      className={cn(
        "pointer-events-none absolute rounded-full blur-[100px]",
        sizeMap[size],
        colorMap[color],
        className
      )}
    />
  );
}
