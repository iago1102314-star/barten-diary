"use client";

import { POST_RECORD_EXIT_TUNING } from "@/lib/entrance/post-record-exit-tuning";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
import { useRef } from "react";

type PostRecordExitBlackProps = {
  onComplete: () => void;
};

/** 別れセリフ後 — 真っ黒へ（扉 SE / outside は親がタイミング制御） */
export function PostRecordExitBlack({ onComplete }: PostRecordExitBlackProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: POST_RECORD_EXIT_TUNING.pureBlackFadeInMs / 1000,
        ease: EASE_DRIFT,
      }}
      onAnimationComplete={() => {
        window.setTimeout(() => {
          onCompleteRef.current();
        }, POST_RECORD_EXIT_TUNING.afterDoorHoldMs);
      }}
    />
  );
}
