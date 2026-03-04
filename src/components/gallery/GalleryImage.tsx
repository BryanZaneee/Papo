"use client";

import { motion } from "framer-motion";
import type { GalleryImage as GalleryImageType } from "@/types";

interface GalleryImageProps {
  image: GalleryImageType;
  onClick: () => void;
  index: number;
}

const borderColors = ["border-pink", "border-lime", "border-blue", "border-orange", "border-pink", "border-lime"];
const labelBgs = ["bg-pink", "bg-lime", "bg-blue", "bg-orange", "bg-pink", "bg-lime"];
const labelTexts = ["text-ink", "text-ink", "text-cream", "text-ink", "text-ink", "text-ink"];

export default function GalleryImageCard({ image, onClick, index }: GalleryImageProps) {
  const isPortrait = image.height > image.width;
  const rotation = ((index * 7 + 3) % 7) - 3; // pseudo-random rotation -3 to 3

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: rotation * 2 }}
      whileInView={{ opacity: 1, scale: 1, rotate: rotation }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ rotate: 0, scale: 1.06, zIndex: 10, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden border-4 ${borderColors[index % 6]} bg-surface ${
        isPortrait ? "row-span-2" : ""
      } transition-shadow hover:shadow-[8px_8px_0_rgba(0,0,0,0.4)]`}
    >
      <div className="relative h-full min-h-[180px] bg-gradient-to-br from-pink/5 via-surface to-blue/5">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-hand text-sm text-cream/10 group-hover:text-cream/25 transition-colors">
            {image.alt}
          </span>
        </div>
        {image.category && (
          <span className={`absolute left-2 top-2 px-2 py-0.5 font-display text-[10px] font-700 uppercase tracking-wider ${labelBgs[index % 6]} ${labelTexts[index % 6]} rotate-[-2deg]`}>
            {image.category}
          </span>
        )}
      </div>
    </motion.div>
  );
}
