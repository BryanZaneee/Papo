"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import VideoCard from "./VideoCard";
import VideoLightbox from "./VideoLightbox";
import { videos } from "@/data/videos";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import type { Video } from "@/types";

export default function VideoSection() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <SectionWrapper id="videos">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.h2
          variants={fadeInUp}
          className="mb-4 text-center text-3xl font-bold tracking-tight md:text-4xl"
        >
          Videos
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mb-12 text-center font-mono text-sm text-foreground/40"
        >
          Live sets, studio sessions, and more
        </motion.p>

        <motion.div
          variants={staggerContainer}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </motion.div>
      </motion.div>

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
