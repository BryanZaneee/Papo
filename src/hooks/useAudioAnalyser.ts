"use client";

import { useEffect, useRef, useState } from "react";

export function useAudioAnalyser(analyser: AnalyserNode | null) {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray));
      rafRef.current = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  return frequencyData;
}
