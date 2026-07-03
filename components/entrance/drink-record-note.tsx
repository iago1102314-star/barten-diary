"use client";

import styles from "@/components/entrance/drink-record-note.module.css";
import type { Drink } from "@/lib/drinks/drink-catalog";
import {
  DRINK_NAME_REVEAL_COLOR,
  DRINK_NAME_REVEAL_EASE,
  DRINK_NAME_REVEAL_TIMING,
  DRINK_NOTE_REVEAL_LAYOUT,
  RECORD_COUNTER_BOTTOM_TUNING,
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
  onExitComplete?: () => void;
  timelineOrigin?: DrinkNameRevealTimelineOrigin;
  skipped?: boolean;
};

/** 録音画面下部 — 説明文（グラデは RecordCounterScene 内） */
export function DrinkRecordNote({
  drink,
  phase = "enter",
  onExitComplete,
  timelineOrigin = "reveal-complete",
  skipped = false,
}: DrinkRecordNoteProps) {
  const prefersReducedMotion = useReducedMotion();
  const noteText = drink.note?.trim() ?? "";
  const instant = prefersReducedMotion === true || skipped;
  const exiting = phase === "exit";
  const exitReportedRef = useRef(false);

  const contentStyle = {
    bottom: `${RECORD_COUNTER_BOTTOM_TUNING.bottomPaddingPercent}%`,
    transform: `translateY(${DRINK_NOTE_REVEAL_LAYOUT.offsetYRem}rem)`,
    paddingInline: `${DRINK_NOTE_REVEAL_LAYOUT.horizontalPaddingRem}rem`,
  } as CSSProperties;

  const textStyle = {
    color: DRINK_NAME_REVEAL_COLOR.note,
    opacity: DRINK_NOTE_REVEAL_LAYOUT.noteOpacity,
    fontSize: `${DRINK_NOTE_REVEAL_LAYOUT.sizeRem}rem`,
    lineHeight: DRINK_NOTE_REVEAL_LAYOUT.lineHeight,
    letterSpacing: `${DRINK_NOTE_REVEAL_LAYOUT.letterSpacingEm}em`,
    maxWidth: `${DRINK_NOTE_REVEAL_LAYOUT.maxWidthRem}rem`,
    textShadow: DRINK_NOTE_REVEAL_LAYOUT.textShadow,
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
    exitReportedRef.current = false;
  }, [phase, noteText]);

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
            if (!exiting || exitReportedRef.current) return;
            exitReportedRef.current = true;
            onExitComplete?.();
          }}
        >
          {noteText}
        </motion.p>
      </div>
    </div>
  );
}
