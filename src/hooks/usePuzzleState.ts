"use client";

import { useState, useEffect, useCallback } from "react";
import { GATE_STORAGE_KEY } from "@/lib/constants";

export function usePuzzleState() {
  const [solved, setSolved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(GATE_STORAGE_KEY);
    if (stored === "true") {
      setSolved(true);
    }
    setLoaded(true);
  }, []);

  const markSolved = useCallback(() => {
    setSolved(true);
    localStorage.setItem(GATE_STORAGE_KEY, "true");
  }, []);

  const reset = useCallback(() => {
    setSolved(false);
    localStorage.removeItem(GATE_STORAGE_KEY);
  }, []);

  return { solved, loaded, markSolved, reset };
}
