"use client";

import { motion } from "framer-motion";
import type { GalleryImage } from "@/types";

interface LightboxProps {
  image: GalleryImage;
  onClose: () => void;
}

export default function Lightbox({ image, onClose }: LightboxProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[80vh] max-w-4xl"
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 font-mono text-sm text-foreground/40 transition-colors hover:text-foreground"
        >
          CLOSE
        </button>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {/* Placeholder — will be replaced with next/image when real images exist */}
          <div
            className="flex items-center justify-center bg-gradient-to-br from-magenta/5 to-violet/5"
            style={{
              width: Math.min(image.width, 800),
              height: Math.min(image.height, 600),
              maxWidth: "80vw",
              maxHeight: "70vh",
            }}
          >
            <span className="font-mono text-sm text-foreground/20">{image.alt}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
