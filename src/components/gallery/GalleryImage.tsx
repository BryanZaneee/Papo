"use client";

import { motion } from "framer-motion";
import type { GalleryImage as GalleryImageType } from "@/types";
import { scaleIn } from "@/lib/animations";

interface GalleryImageProps {
  image: GalleryImageType;
  onClick: () => void;
}

export default function GalleryImageCard({ image, onClick }: GalleryImageProps) {
  const isPortrait = image.height > image.width;

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-magenta/30 ${
        isPortrait ? "row-span-2" : ""
      }`}
    >
      <div className="relative h-full min-h-[200px] bg-gradient-to-br from-violet/5 to-cyan/5">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs text-foreground/15 transition-colors group-hover:text-foreground/30">
            {image.alt}
          </span>
        </div>
        {image.category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground/40 backdrop-blur-sm">
            {image.category}
          </span>
        )}
      </div>
    </motion.div>
  );
}
