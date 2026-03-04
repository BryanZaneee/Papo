"use client";

import { motion } from "framer-motion";
import type { Video } from "@/types";
import { scaleIn } from "@/lib/animations";

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-cyan/30"
    >
      <div className="relative aspect-video bg-surface-light">
        {/* Placeholder thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet/10 to-cyan/10">
          <svg
            className="h-12 w-12 text-foreground/20 transition-colors group-hover:text-cyan/60"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-1 text-sm font-medium">{video.title}</h3>
        {video.date && (
          <p className="font-mono text-xs text-foreground/30">{video.date}</p>
        )}
      </div>
    </motion.div>
  );
}
