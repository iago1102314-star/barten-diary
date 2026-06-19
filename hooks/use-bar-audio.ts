"use client";

import {
  barAudioEngine,
  unlockBarAudioForUserGesture,
} from "@/lib/entrance/bar-audio-engine";
import { useEffect } from "react";

let consumerCount = 0;

/** 扉を開ける / メモを見る — 最初の明確なユーザー操作後にのみ呼ぶ */
export function prepareBarAudioOnUserGesture(): void {
  unlockBarAudioForUserGesture();
}

/** バー音声 — モジュール共有エンジン経由（SE プリロード・低遅延再生） */
export function useBarAudio() {
  useEffect(() => {
    consumerCount += 1;

    return () => {
      consumerCount -= 1;
      if (consumerCount === 0) {
        barAudioEngine.dispose();
      }
    };
  }, []);

  return barAudioEngine;
}
