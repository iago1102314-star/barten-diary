"use client";

import { MOOD_CURTAIN } from "@/lib/entrance/mood-curtain";
import { motion } from "motion/react";

export type MoodCurtainPhase = "hidden" | "dropping" | "down" | "closing";

type MoodCurtainProps = {
  phase: MoodCurtainPhase;
  onDropComplete?: () => void;
  onCloseComplete?: () => void;
};

const fabricGradient = `linear-gradient(
  to bottom,
  ${MOOD_CURTAIN.fabric} 0%,
  ${MOOD_CURTAIN.fabric} 68%,
  ${MOOD_CURTAIN.fabricSoft} 88%,
  transparent 100%
)`;

const dropFabricClassName = "absolute inset-x-0 top-0 h-[108%] origin-top";
const closeFabricClassName = "absolute inset-x-0 top-0 h-[108%] origin-bottom";

/** ネイビーの幕 — 入場は上から下ろす、選択確定は scaleY 1→0 で下へ落とす */
export function MoodCurtain({
  phase,
  onDropComplete,
  onCloseComplete,
}: MoodCurtainProps) {
  if (phase === "hidden") return null;

  if (phase === "down") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-[38] overflow-hidden"
        aria-hidden
      >
        <div className={dropFabricClassName} style={{ background: fabricGradient }} />
        <CurtainGrain />
      </div>
    );
  }

  const isClosing = phase === "closing";
  const duration = isClosing
    ? MOOD_CURTAIN.closeDurationSec
    : MOOD_CURTAIN.dropDurationSec;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[38] overflow-hidden"
      aria-hidden
    >
      <motion.div
        className={isClosing ? closeFabricClassName : dropFabricClassName}
        style={{ background: fabricGradient }}
        initial={{ scaleY: isClosing ? 1 : 0 }}
        animate={{ scaleY: isClosing ? 0 : 1 }}
        transition={{ duration, ease: "linear" }}
        onAnimationComplete={() => {
          if (phase === "dropping") onDropComplete?.();
          if (phase === "closing") onCloseComplete?.();
        }}
      />
      <CurtainGrain />
    </div>
  );
}

function CurtainGrain() {
  return (
    <div
      className="scene-grain pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
      aria-hidden
    />
  );
}
