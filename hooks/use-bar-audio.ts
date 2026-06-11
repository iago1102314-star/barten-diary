"use client";

import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { useEffect } from "react";

let consumerCount = 0;

/** バー音声 — モジュール共有エンジン経由（SE プリロード・低遅延再生） */
export function useBarAudio() {
  useEffect(() => {
    consumerCount += 1;
    void barAudioEngine.warmUp();

    return () => {
      consumerCount -= 1;
      if (consumerCount === 0) {
        barAudioEngine.dispose();
      }
    };
  }, []);

  return barAudioEngine;
}
