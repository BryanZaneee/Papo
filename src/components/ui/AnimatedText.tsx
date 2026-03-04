"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function AnimatedText({
  text,
  className,
  delay = 0,
  as: Tag = "h1",
}: AnimatedTextProps) {
  const letters = text.split("");

  return (
    <Tag className={cn("flex flex-wrap", className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={`${letter}-${i}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + i * 0.04,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </Tag>
  );
}
