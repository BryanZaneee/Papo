"use client";

import { AnimatePresence } from "framer-motion";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import PuzzleGate from "@/components/gate/PuzzleGate";
import GateTransition from "@/components/gate/GateTransition";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import BioSection from "@/components/sections/BioSection";
import MusicSection from "@/components/sections/MusicSection";
import VideoSection from "@/components/video/VideoSection";
import GallerySection from "@/components/gallery/GallerySection";
import ContactSection from "@/components/sections/ContactSection";
import AudioPlayer from "@/components/audio/AudioPlayer";
import { useState } from "react";

export default function Home() {
  const { solved, loaded, markSolved } = usePuzzleState();
  const [showTransition, setShowTransition] = useState(false);

  const handleGateSolved = () => {
    setShowTransition(true);
    markSolved();
  };

  // Don't render until we've checked localStorage
  if (!loaded) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {!solved && !showTransition && (
          <PuzzleGate key="gate" onSolved={handleGateSolved} />
        )}
      </AnimatePresence>

      {showTransition && <GateTransition />}

      {(solved || showTransition) && (
        <>
          <Header />
          <main className="pb-20">
            <HeroSection />
            <MusicSection />
            <VideoSection />
            <GallerySection />
            <BioSection />
            <ContactSection />
          </main>
          <Footer />
          <AudioPlayer />
        </>
      )}
    </>
  );
}
