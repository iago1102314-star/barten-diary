"use client";

import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

type EnteringRevealProps = {
  onComplete?: () => void;
  /** 暗幕の色（省略時は真っ黒） */
  backdropColor?: string;
  /** true で待ちタイマーを飛ばして即完了 */
  skipped?: boolean;
};

/** 扉を開けて店内の明るさが滲む — EnteringScene 相当 */
export function EnteringReveal({
  onComplete,
  backdropColor = "#000000",
  skipped = false,
}: EnteringRevealProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const fadeMs = BAR_AUDIO_TIMING.counterRevealFadeMs;
  const fadeDelayMs = BAR_AUDIO_TIMING.counterRevealFadeDelayMs;
  const postRevealMs = BAR_AUDIO_TIMING.moodPromptDelayAfterRevealMs;

  useEffect(() => {
    if (skipped) {
      onCompleteRef.current?.();
      return;
    }

    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, fadeDelayMs + fadeMs + postRevealMs);

    return () => clearTimeout(timer);
  }, [fadeDelayMs, fadeMs, postRevealMs, skipped]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[19]"
      style={{ backgroundColor: backdropColor }}
      initial={{ opacity: 1 }}
      animate={{ opacity: skipped ? 0 : 0 }}
      transition={{
        duration: skipped ? 0 : fadeMs / 1000,
        ease: EASE_DRIFT,
        delay: skipped ? 0 : fadeDelayMs / 1000,
      }}
    />
  );
}
