"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import GalleryImageCard from "./GalleryImage";
import Lightbox from "./Lightbox";
import { galleryImages } from "@/data/gallery";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import type { GalleryImage } from "@/types";

export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <SectionWrapper id="gallery">
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
          Gallery
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mb-12 text-center font-mono text-sm text-foreground/40"
        >
          Live shows, studio, and behind the scenes
        </motion.p>

        <motion.div
          variants={staggerContainer}
          className="grid auto-rows-[200px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
        >
          {galleryImages.map((image) => (
            <GalleryImageCard
              key={image.id}
              image={image}
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedImage && (
          <Lightbox
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </AnimatePresence>
    </SectionWrapper>
  );
}
