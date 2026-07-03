"use client";

import {
  DRINK_NAME_REVEAL_COLOR,
  DRINK_NAME_REVEAL_DIVIDER,
  DRINK_NAME_REVEAL_EASE,
  DRINK_NAME_REVEAL_TIMING,
  drinkNameRevealDiamondDelaySec,
  drinkNameRevealEnterDelaySec,
  drinkNameRevealEnterDurationSec,
  getDrinkNameRevealDividerMetrics,
  type DrinkNameRevealTimelineOrigin,
} from "@/lib/entrance/drink-name-reveal-tuning";
import { ornamentalDiamondPath } from "@/lib/entrance/mood-ornamental-divider-tuning";
import { motion } from "motion/react";

type DrinkNameRevealDividerProps = {
  instant?: boolean;
  timelineOrigin?: DrinkNameRevealTimelineOrigin;
};

/** 酒名 — 英語とカタカナの間の細い装飾線 */
export function DrinkNameRevealDivider({
  instant = false,
  timelineOrigin = "reveal-complete",
}: DrinkNameRevealDividerProps) {
  const metrics = getDrinkNameRevealDividerMetrics();
  const { viewBoxHeight, centerY, viewBoxMinX, viewBoxWidth, lineStartX, lineEndX, strokeWidth, diamond } =
    metrics;

  const delaySec = instant
    ? 0
    : drinkNameRevealEnterDelaySec(
        DRINK_NAME_REVEAL_TIMING.lineDelayMs,
        timelineOrigin,
      );
  const durationSec = instant
    ? 0
    : drinkNameRevealEnterDurationSec(
        DRINK_NAME_REVEAL_TIMING.underlineDurationMs,
        timelineOrigin,
      );
  const diamondDelaySec = instant ? 0 : drinkNameRevealDiamondDelaySec(timelineOrigin);

  return (
    <div
      className="mx-auto"
      style={{
        width: `${DRINK_NAME_REVEAL_DIVIDER.widthPercent}%`,
        maxWidth: `${DRINK_NAME_REVEAL_DIVIDER.maxWidthRem}rem`,
      }}
    >
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
          initial={instant ? false : { pathLength: 0, opacity: 0.35 }}
          animate={{
            pathLength: 1,
            opacity: DRINK_NAME_REVEAL_DIVIDER.lineOpacity,
          }}
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
          animate={{ opacity: DRINK_NAME_REVEAL_DIVIDER.lineDiamondOpacity }}
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
    </div>
  );
}
