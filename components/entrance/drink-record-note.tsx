"use client";

import { useCompactHeightViewport } from "@/hooks/use-compact-height-viewport";
import styles from "@/components/entrance/drink-record-note.module.css";
import type { Drink } from "@/lib/drinks/drink-catalog";
import {
  DRINK_NAME_REVEAL_COLOR,
  DRINK_NAME_REVEAL_EASE,
  DRINK_NAME_REVEAL_TIMING,
  resolveDrinkNoteRevealLayout,
  resolveRecordCounterBottomTuning,
  drinkNameRevealEnterDelaySec,
  drinkNameRevealEnterDurationSec,
  drinkNameRevealNoteDelayMs,
  type DrinkNameRevealTimelineOrigin,
} from "@/lib/entrance/drink-name-reveal-tuning";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type CSSProperties } from "react";

export type DrinkRecordNotePhase = "enter" | "exit";

type DrinkRecordNoteProps = {
  drink: Pick<Drink, "note">;
  phase?: DrinkRecordNotePhase;
  onEnterComplete?: () => void;
  onExitComplete?: () => void;
  timelineOrigin?: DrinkNameRevealTimelineOrigin;
  skipped?: boolean;
};

/** 録音画面下部 — 説明文（グラデは RecordCounterScene 内） */
export function DrinkRecordNote({
  drink,
  phase = "enter",
  onEnterComplete,
  onExitComplete,
  timelineOrigin = "reveal-complete",
  skipped = false,
}: DrinkRecordNoteProps) {
  const prefersReducedMotion = useReducedMotion();
  const compactHeight = useCompactHeightViewport();
  const noteLayout = resolveDrinkNoteRevealLayout(compactHeight);
  const bottomTuning = resolveRecordCounterBottomTuning(compactHeight);
  const noteText = drink.note?.trim() ?? "";
  const instant = prefersReducedMotion === true || skipped;
  const exiting = phase === "exit";
  const enterReportedRef = useRef(false);
  const exitReportedRef = useRef(false);

  const contentStyle = {
    bottom: `${bottomTuning.bottomPaddingPercent}%`,
    transform: `translateY(${noteLayout.offsetYRem}rem)`,
    paddingInline: `${noteLayout.horizontalPaddingRem}rem`,
  } as CSSProperties;

  const textStyle = {
    color: DRINK_NAME_REVEAL_COLOR.note,
    opacity: noteLayout.noteOpacity,
    fontSize: `${noteLayout.sizeRem}rem`,
    lineHeight: noteLayout.lineHeight,
    letterSpacing: `${noteLayout.letterSpacingEm}em`,
    maxWidth: `${noteLayout.maxWidthRem}rem`,
    textShadow: noteLayout.textShadow,
  } as CSSProperties;

  const noteDelaySec = instant
    ? 0
    : drinkNameRevealEnterDelaySec(
        drinkNameRevealNoteDelayMs(),
        timelineOrigin,
      );
  const noteDurationSec = instant
    ? 0
    : drinkNameRevealEnterDurationSec(
        DRINK_NAME_REVEAL_TIMING.noteDurationMs,
        timelineOrigin,
      );
  const noteExitDurationSec = instant
    ? 0
    : DRINK_NAME_REVEAL_TIMING.noteExitDurationMs / 1000;
  const enterTransition = instant
    ? { duration: 0 }
    : {
        delay: noteDelaySec,
        duration: noteDurationSec,
        ease: DRINK_NAME_REVEAL_EASE.note,
      };
  const exitTransition = instant
    ? { duration: 0 }
    : {
        duration: noteExitDurationSec,
        ease: DRINK_NAME_REVEAL_EASE.note,
      };

  useEffect(() => {
    enterReportedRef.current = false;
    exitReportedRef.current = false;
  }, [phase, noteText]);

  useEffect(() => {
    if (!instant || exiting || !noteText || enterReportedRef.current) return;
    enterReportedRef.current = true;
    onEnterComplete?.();
  }, [exiting, instant, noteText, onEnterComplete]);

  useEffect(() => {
    if (!exiting || instant) {
      if (exiting && instant) {
        onExitComplete?.();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      if (exitReportedRef.current) return;
      exitReportedRef.current = true;
      onExitComplete?.();
    }, noteExitDurationSec * 1000);

    return () => window.clearTimeout(timer);
  }, [exiting, instant, noteExitDurationSec, onExitComplete]);

  if (!noteText) return null;

  return (
    <div className={styles.chrome} aria-hidden>
      <div className={styles.content} style={contentStyle}>
        <motion.p
          className={styles.noteText}
          style={textStyle}
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={exiting ? exitTransition : enterTransition}
          onAnimationComplete={() => {
            if (exiting) {
              if (exitReportedRef.current) return;
              exitReportedRef.current = true;
              onExitComplete?.();
              return;
            }

            if (enterReportedRef.current) return;
            enterReportedRef.current = true;
            onEnterComplete?.();
          }}
        >
          {noteText}
        </motion.p>
      </div>
    </div>
  );
}
