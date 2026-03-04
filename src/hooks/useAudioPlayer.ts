"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Track } from "@/types";

interface AudioPlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
}

export function useAudioPlayer(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
  });

  const initAudioContext = useCallback(() => {
    if (contextRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();

    analyser.fftSize = 256;
    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    contextRef.current = ctx;
    sourceRef.current = source;
    analyserRef.current = analyser;
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audioRef.current = audio;

    const updateTime = () => {
      setState((s) => ({
        ...s,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      }));
    };

    const onEnded = () => {
      setState((s) => ({ ...s, isPlaying: false }));
      // Auto-play next track
      const currentIndex = tracks.findIndex((t) => t.src === audio.src);
      if (currentIndex < tracks.length - 1) {
        playTrack(tracks[currentIndex + 1]);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      contextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTrack = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      initAudioContext();

      if (state.currentTrack?.id !== track.id) {
        audio.src = track.src;
        audio.load();
      }

      audio.play().catch(() => {});
      setState((s) => ({ ...s, isPlaying: true, currentTrack: track }));
    },
    [initAudioContext, state.currentTrack?.id]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else if (state.currentTrack) {
      playTrack(state.currentTrack);
    } else if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
  }, [state.isPlaying, state.currentTrack, pause, playTrack, tracks]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setState((s) => ({ ...s, volume: vol }));
  }, []);

  const skipNext = useCallback(() => {
    const idx = tracks.findIndex((t) => t.id === state.currentTrack?.id);
    const next = tracks[(idx + 1) % tracks.length];
    playTrack(next);
  }, [tracks, state.currentTrack, playTrack]);

  const skipPrev = useCallback(() => {
    const idx = tracks.findIndex((t) => t.id === state.currentTrack?.id);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    playTrack(prev);
  }, [tracks, state.currentTrack, playTrack]);

  return {
    ...state,
    analyser: analyserRef.current,
    playTrack,
    pause,
    togglePlay,
    seek,
    setVolume,
    skipNext,
    skipPrev,
  };
}
