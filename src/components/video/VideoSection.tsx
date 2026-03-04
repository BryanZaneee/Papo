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
      <div className="flex items-center gap-4 mb-12">
        <motion.h2
          initial={{ opacity: 0, x: -30, rotate: 2 }}
          whileInView={{ opacity: 1, x: 0, rotate: 1 }}
          viewport={{ once: true }}
          className="inline-block bg-blue px-5 py-2 font-display text-4xl font-800 uppercase tracking-tight text-cream md:text-5xl"
        >
          Videos
        </motion.h2>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="font-hand text-xl text-blue rotate-[-3deg]"
        >
          watch the magic
        </motion.span>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
