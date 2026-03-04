"use client";

import { motion } from "framer-motion";
import type { Video } from "@/types";

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  index: number;
}

const borderColors = ["border-pink", "border-blue", "border-lime"];
const labelBgs = ["bg-pink", "bg-blue", "bg-lime"];

export default function VideoCard({ video, onClick, index }: VideoCardProps) {
  const rotation = index % 2 === 0 ? -1.5 : 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: rotation }}
      viewport={{ once: true }}
      whileHover={{ rotate: 0, scale: 1.04, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden border-4 ${borderColors[index % 3]} bg-surface transition-shadow hover:shadow-[6px_6px_0_var(--pink)]`}
    >
      <div className="relative aspect-video bg-surface-light">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center border-4 border-cream/20 transition-colors group-hover:border-pink group-hover:bg-pink/20">
            <svg className="h-8 w-8 text-cream/30 group-hover:text-cream" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-sm font-700 uppercase tracking-wide">{video.title}</h3>
        {video.date && (
          <span className={`mt-2 inline-block px-2 py-0.5 font-mono text-[10px] font-700 uppercase text-ink ${labelBgs[index % 3]}`}>
            {video.date}
          </span>
        )}
      </div>
    </motion.div>
  );
}
