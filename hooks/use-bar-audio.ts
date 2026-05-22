"use client";

import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import { useCallback, useEffect, useRef } from "react";

function createAudio(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    return new Audio(src);
  } catch {
    return null;
  }
}

async function playOnce(src: string, volume: number): Promise<void> {
  const audio = createAudio(src);
  if (!audio) return;

  audio.volume = volume;
  try {
    await audio.play();
  } catch {
    // ファイル無し・自動再生ブロック等は無視
  }
}

export function useBarAudio() {
  const rainRef = useRef<HTMLAudioElement | null>(null);
  const rainStartedRef = useRef(false);

  const startRain = useCallback((volume = 0.35) => {
    if (rainStartedRef.current) return;

    const audio = createAudio(ENTRANCE_SOUNDS.rain);
    if (!audio) return;

    audio.loop = true;
    audio.volume = volume;
    rainRef.current = audio;
    rainStartedRef.current = true;

    void audio.play().catch(() => {
      rainStartedRef.current = false;
      rainRef.current = null;
    });
  }, []);

  const setRainVolume = useCallback((volume: number) => {
    if (rainRef.current) {
      rainRef.current.volume = volume;
    }
  }, []);

  const stopRain = useCallback(() => {
    const audio = rainRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    rainRef.current = null;
    rainStartedRef.current = false;
  }, []);

  const playBell = useCallback(() => {
    void playOnce(ENTRANCE_SOUNDS.bell, 0.5);
  }, []);

  const playDoor = useCallback(() => {
    void playOnce(ENTRANCE_SOUNDS.door, 0.4);
  }, []);

  useEffect(() => {
    return () => {
      stopRain();
    };
  }, [stopRain]);

  return {
    startRain,
    setRainVolume,
    stopRain,
    playBell,
    playDoor,
  };
}
