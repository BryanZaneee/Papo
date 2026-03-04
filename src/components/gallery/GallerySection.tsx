"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import GalleryImageCard from "./GalleryImage";
import Lightbox from "./Lightbox";
import { galleryImages } from "@/data/gallery";
import type { GalleryImage } from "@/types";

export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <SectionWrapper id="gallery" accent="orange">
      <div className="flex items-end gap-6 mb-10">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="font-display text-5xl font-800 uppercase tracking-tighter text-cream md:text-6xl"
        >
          Gallery
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="mb-3 h-px flex-1 origin-left bg-cream/10"
        />
      </div>

      <div className="grid auto-rows-[200px] grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {galleryImages.map((image, i) => (
          <GalleryImageCard
            key={image.id}
            image={image}
            index={i}
            onClick={() => setSelectedImage(image)}
          />
        ))}
      </div>

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
