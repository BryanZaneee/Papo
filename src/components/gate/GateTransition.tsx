"use client";

import { motion } from "framer-motion";

export default function GateTransition() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.2, delay: 0.3 }}
      className="pointer-events-none fixed inset-0 z-[99] bg-background"
      onAnimationComplete={(def) => {
        // Element removes itself after animation
        if (typeof def === "object" && "opacity" in def) return;
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/30 blur-3xl"
      />
    </motion.div>
  );
}
