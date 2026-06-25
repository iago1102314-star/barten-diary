"use client";

import {
  DRINK_NAME_REVEAL_COLOR,
  DRINK_NAME_REVEAL_EASE,
  DRINK_NAME_REVEAL_TIMING,
  drinkNameRevealUnderlineDelayMs,
} from "@/lib/entrance/drink-name-reveal-tuning";
import {
  getPastBottleDividerMetrics,
  MOOD_ORNAMENTAL_DIVIDER_TUNING,
  ornamentalDiamondPath,
} from "@/lib/entrance/mood-ornamental-divider-tuning";
import { motion } from "motion/react";

type DrinkNameRevealDividerProps = {
  instant?: boolean;
};

/** 酒名 — 英語とカタカナの間の細い装飾線（過去のボトルからと同系） */
export function DrinkNameRevealDivider({
  instant = false,
}: DrinkNameRevealDividerProps) {
  const { viewBoxHeight, centerY } = MOOD_ORNAMENTAL_DIVIDER_TUNING;
  const { viewBoxMinX, viewBoxWidth, lineStartX, lineEndX, strokeWidth, diamond } =
    getPastBottleDividerMetrics();

  const delaySec = instant ? 0 : drinkNameRevealUnderlineDelayMs() / 1000;
  const durationSec = instant ? 0 : DRINK_NAME_REVEAL_TIMING.underlineDurationMs / 1000;
  const diamondDelaySec = instant ? 0 : delaySec + durationSec * 0.82;

  return (
    <svg
      width="100%"
      height={viewBoxHeight}
      viewBox={`${viewBoxMinX} 0 ${viewBoxWidth} ${viewBoxHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="block"
      style={{ color: DRINK_NAME_REVEAL_COLOR.line }}
    >
      <motion.line
        x1={lineStartX}
        y1={centerY}
        x2={lineEndX}
        y2={centerY}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={instant ? false : { pathLength: 0, opacity: 0.2 }}
        animate={{ pathLength: 1, opacity: 0.55 }}
        transition={
          instant
            ? { duration: 0 }
            : {
                pathLength: {
                  delay: delaySec,
                  duration: durationSec,
                  ease: DRINK_NAME_REVEAL_EASE.underline,
                },
                opacity: {
                  delay: delaySec,
                  duration: durationSec,
                  ease: DRINK_NAME_REVEAL_EASE.underline,
                },
              }
        }
      />
      <motion.path
        d={ornamentalDiamondPath(
          diamond.centerX,
          centerY,
          diamond.halfWidth,
          diamond.halfHeight,
        )}
        fill={DRINK_NAME_REVEAL_COLOR.lineDiamond}
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={
          instant
            ? { duration: 0 }
            : {
                delay: diamondDelaySec,
                duration: 0.18,
                ease: DRINK_NAME_REVEAL_EASE.underline,
              }
        }
      />
    </svg>
  );
}
