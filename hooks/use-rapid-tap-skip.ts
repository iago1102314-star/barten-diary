"use client";

import {
  ENTRANCE_RAPID_TAP_SKIP_COUNT,
  ENTRANCE_RAPID_TAP_SKIP_MAX_GAP_MS,
} from "@/lib/entrance/entrance-rapid-tap-skip";
import { useCallback, useRef } from "react";

/**
 * 連打検出 — 単タップでは onSkip を呼ばない。
 * 戻り値 true = 今回のタップでスキップ成立。
 */
export function useRapidTapSkip(onSkip: () => void) {
  const onSkipRef = useRef(onSkip);
  const streakRef = useRef(0);
  const lastTapAtRef = useRef(0);

  onSkipRef.current = onSkip;

  const registerTap = useCallback(() => {
    const now = Date.now();
    const gap = now - lastTapAtRef.current;

    if (lastTapAtRef.current > 0 && gap > ENTRANCE_RAPID_TAP_SKIP_MAX_GAP_MS) {
      streakRef.current = 0;
    }

    streakRef.current += 1;
    lastTapAtRef.current = now;

    if (streakRef.current < ENTRANCE_RAPID_TAP_SKIP_COUNT) {
      return false;
    }

    streakRef.current = 0;
    lastTapAtRef.current = 0;
    onSkipRef.current();
    return true;
  }, []);

  const resetStreak = useCallback(() => {
    streakRef.current = 0;
    lastTapAtRef.current = 0;
  }, []);

  return { registerTap, resetStreak };
}
