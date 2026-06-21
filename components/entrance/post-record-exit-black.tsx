"use client";

import { POST_RECORD_EXIT_TUNING } from "@/lib/entrance/post-record-exit-tuning";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

type PostRecordExitBlackProps = {
  onDoor: () => void;
  onComplete: () => void;
};

/** 別れセリフ後 — 真っ黒へ（扉 SE は親が 0.5 倍で再生） */
export function PostRecordExitBlack({ onDoor, onComplete }: PostRecordExitBlackProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doorPlayedRef = useRef(false);

  useEffect(() => {
    return () => {
      doorPlayedRef.current = false;
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: POST_RECORD_EXIT_TUNING.pureBlackFadeInMs / 1000,
        ease: EASE_DRIFT,
      }}
      onAnimationStart={() => {
        if (doorPlayedRef.current) return;
        doorPlayedRef.current = true;
        onDoor();
      }}
      onAnimationComplete={() => {
        window.setTimeout(() => {
          onCompleteRef.current();
        }, POST_RECORD_EXIT_TUNING.afterDoorHoldMs);
      }}
    />
  );
}
