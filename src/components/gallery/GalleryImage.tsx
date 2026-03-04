"use client";

import { motion } from "framer-motion";
import type { GalleryImage as GalleryImageType } from "@/types";

interface GalleryImageProps {
  image: GalleryImageType;
  onClick: () => void;
  index: number;
}

export default function GalleryImageCard({ image, onClick, index }: GalleryImageProps) {
  const isPortrait = image.height > image.width;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden border border-cream/10 bg-surface transition-colors hover:border-pink/30 ${
        isPortrait ? "row-span-2" : ""
      }`}
    >
      <div className="relative h-full min-h-[180px] bg-surface-light">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/8 group-hover:text-cream/15 transition-colors">
            {image.alt}
          </span>
        </div>
        {image.category && (
          <span className="absolute left-0 top-3 bg-pink/90 px-2.5 py-0.5 font-display text-[9px] font-700 uppercase tracking-wider text-ink opacity-0 transition-opacity group-hover:opacity-100">
            {image.category}
          </span>
        )}
      </div>
    </motion.div>
  );
}
