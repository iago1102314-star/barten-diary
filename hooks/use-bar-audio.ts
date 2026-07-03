"use client";

import {
  attachBarAudioAppLifecycle,
  barAudioEngine,
  isBarAudioUnlockedByClient,
  primeCounterEntryAudioOnUserGesture,
  restoreBarAudioUnlockAfterModuleReload,
  unlockBarAudioForUserGesture,
} from "@/lib/entrance/bar-audio-engine";
import { useEffect } from "react";

let consumerCount = 0;

/** 扉を開ける / メモを見る — 最初の明確なユーザー操作後にのみ呼ぶ */
export function prepareBarAudioOnUserGesture(): void {
  unlockBarAudioForUserGesture();
}

/** カウンターへ — 入店前の jazz / SE 先行解放（await より前に呼ぶ） */
export function prepareCounterEntryAudioOnUserGesture(): void {
  primeCounterEntryAudioOnUserGesture();
}

/** React が unlock 済みなのにモジュールだけ HMR でリセットされたとき */
export function syncBarAudioUnlockFromClient(wasUnlockedByClient: boolean): void {
  if (!wasUnlockedByClient || isBarAudioUnlockedByClient()) return;
  restoreBarAudioUnlockAfterModuleReload();
}

/** バー音声 — モジュール共有エンジン経由（SE プリロード・低遅延再生） */
export function useBarAudio() {
  useEffect(() => {
    consumerCount += 1;
    attachBarAudioAppLifecycle();

    return () => {
      consumerCount -= 1;
      if (consumerCount === 0) {
        barAudioEngine.dispose();
      }
    };
  }, []);

  return barAudioEngine;
}
