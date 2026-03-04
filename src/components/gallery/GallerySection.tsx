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
      <div className="flex items-center gap-4 mb-12">
        <motion.h2
          initial={{ opacity: 0, x: -30, rotate: -3 }}
          whileInView={{ opacity: 1, x: 0, rotate: -1 }}
          viewport={{ once: true }}
          className="inline-block bg-orange px-5 py-2 font-display text-4xl font-800 uppercase tracking-tight text-ink md:text-5xl"
        >
          Gallery
        </motion.h2>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="font-hand text-xl text-orange rotate-[4deg]"
        >
          snaps & moments
        </motion.span>
      </div>

      <div className="grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
