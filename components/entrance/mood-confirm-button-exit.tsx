"use client";

import {
  MoodOptionButton,
  type MoodOption,
} from "@/components/entrance/bar-seat-mood-picker";
import { MOOD_SELECT_EXIT_SCALED } from "@/lib/entrance/mood-select-exit-timing";
import { MOOD_SELECT_EXIT_TUNING } from "@/lib/entrance/mood-select-exit-tuning";
import { EASE_DECELERATE } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const BUTTON_WIDTH_SCALE = 0.9;

type MoodConfirmButtonExitProps = {
  option: MoodOption;
  anchor: { centerX: number; centerY: number; width: number };
  phase: "move" | "dissolve";
  onDissolveComplete: () => void;
};

/** 選ばれた感情ボタン — 中央へ → 静止 → 闇に溶ける */
export function MoodConfirmButtonExit({
  option,
  anchor,
  phase,
  onDissolveComplete,
}: MoodConfirmButtonExitProps) {
  const dissolveDoneRef = useRef(false);
  const onDissolveCompleteRef = useRef(onDissolveComplete);

  onDissolveCompleteRef.current = onDissolveComplete;

  const moveSec = MOOD_SELECT_EXIT_SCALED.buttonMoveToCenterSec;
  const dissolveSec = MOOD_SELECT_EXIT_SCALED.buttonDissolveSec;
  const dissolving = phase === "dissolve";
  const centerX =
    typeof window !== "undefined" ? window.innerWidth / 2 : anchor.centerX;
  const centerY =
    typeof window !== "undefined"
      ? window.innerHeight / 2 +
        MOOD_SELECT_EXIT_TUNING.buttonMoveCenterOffsetYpx
      : anchor.centerY;
  const targetWidth =
    typeof window !== "undefined"
      ? Math.min(window.innerWidth * 0.9 * BUTTON_WIDTH_SCALE, 384)
      : anchor.width;

  useEffect(() => {
    if (phase !== "dissolve") return;

    dissolveDoneRef.current = false;
    const timer = window.setTimeout(() => {
      if (dissolveDoneRef.current) return;
      dissolveDoneRef.current = true;
      onDissolveCompleteRef.current();
    }, dissolveSec * 1000);

    return () => window.clearTimeout(timer);
  }, [phase, dissolveSec]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[200]">
      <motion.div
        className="fixed"
        style={{ x: "-50%", y: "-50%" }}
        initial={{
          left: anchor.centerX,
          top: anchor.centerY,
          width: anchor.width,
        }}
        animate={{
          left: centerX,
          top: centerY,
          width: targetWidth,
        }}
        transition={{
          left: { duration: moveSec, ease: EASE_DECELERATE },
          top: { duration: moveSec, ease: EASE_DECELERATE },
          width: { duration: moveSec, ease: EASE_DECELERATE },
        }}
      >
        <motion.div
          initial={false}
          animate={{
            opacity: dissolving ? 0 : 1,
            scale: dissolving
              ? MOOD_SELECT_EXIT_TUNING.buttonDissolveScale
              : 1,
          }}
          transition={{
            opacity: {
              duration: dissolving ? dissolveSec : 0,
              ease: [0.4, 0, 0.2, 1],
            },
            scale: {
              duration: dissolving ? dissolveSec : 0,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          style={{
            filter: dissolving
              ? `blur(${MOOD_SELECT_EXIT_TUNING.buttonDissolveBlurPx}px)`
              : "blur(0px)",
            transition: dissolving
              ? `filter ${dissolveSec}s cubic-bezier(0.4, 0, 0.2, 1)`
              : undefined,
          }}
        >
          <MoodOptionButton
            option={option}
            index={0}
            onClick={() => {}}
            disabled
            skipEntrance
            nowrapText
            totalOptions={1}
            entranceBaseDelay={0}
            optionStagger={0}
            slideDuration={0}
          />
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}
