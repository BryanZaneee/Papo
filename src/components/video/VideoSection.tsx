"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import VideoCard from "./VideoCard";
import VideoLightbox from "./VideoLightbox";
import { videos } from "@/data/videos";
import type { Video } from "@/types";

export default function VideoSection() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <SectionWrapper id="videos" accent="blue">
      <div className="flex items-end gap-6 mb-10">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="font-display text-5xl font-800 uppercase tracking-tighter text-cream md:text-6xl"
        >
          Videos
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="mb-3 h-px flex-1 origin-left bg-cream/10"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, i) => (
          <VideoCard
            key={video.id}
            video={video}
            index={i}
            onClick={() => setSelectedVideo(video)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <VideoLightbox
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </AnimatePresence>
    </SectionWrapper>
  );
}
