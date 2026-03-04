"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  accent?: "pink" | "lime" | "blue" | "orange";
}

const accentBorders: Record<string, string> = {
  pink: "border-l-pink",
  lime: "border-l-lime",
  blue: "border-l-blue",
  orange: "border-l-orange",
};

export default function SectionWrapper({ children, id, className, accent }: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative px-6 py-20 md:py-28",
        accent && `border-l-4 ${accentBorders[accent]}`,
        className
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </motion.section>
  );
}
