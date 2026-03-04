"use client";

import { motion } from "framer-motion";
import type { Video } from "@/types";

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  index: number;
}

export default function VideoCard({ video, onClick, index }: VideoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden border border-cream/10 bg-surface transition-colors hover:border-pink/40"
    >
      <div className="relative aspect-video bg-surface-light">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center border border-cream/10 transition-all group-hover:border-pink group-hover:bg-pink/10">
            <svg className="h-6 w-6 text-cream/20 transition-colors group-hover:text-pink" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <h3 className="font-display text-sm font-600 uppercase tracking-wide text-cream/70 group-hover:text-cream">{video.title}</h3>
        {video.date && (
          <span className="font-mono text-[10px] text-cream/20">{video.date}</span>
        )}
      </div>
    </motion.div>
  );
}
