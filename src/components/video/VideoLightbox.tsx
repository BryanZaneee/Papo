"use client";

import { motion } from "framer-motion";
import type { Video } from "@/types";

interface VideoLightboxProps {
  video: Video;
  onClose: () => void;
}

export default function VideoLightbox({ video, onClose }: VideoLightboxProps) {
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
        className="relative w-full max-w-4xl"
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 font-mono text-sm text-foreground/40 transition-colors hover:text-foreground"
        >
          CLOSE
        </button>
        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-surface">
          <iframe
            src={video.embedUrl}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="mt-4 text-center text-sm text-foreground/60">{video.title}</p>
      </motion.div>
    </motion.div>
  );
}
