"use client";

import { RecordBottomActionDivider } from "@/components/entrance/record-bottom-action-divider";
import styles from "@/components/entrance/record-bottom-action.module.css";
import { Reveal } from "@/components/motion/reveal";
import {
  DRINK_NAME_REVEAL_EASE,
  DRINK_NOTE_REVEAL_LAYOUT,
  RECORD_BOTTOM_ACTION_TUNING,
  RECORD_COUNTER_BOTTOM_TUNING,
} from "@/lib/entrance/drink-name-reveal-tuning";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type CSSProperties } from "react";

export type RecordBottomTextPhase = "sip" | "sip-exit" | "finish";

type RecordBottomActionProps = {
  textPhase: RecordBottomTextPhase;
  onSip: () => void;
  onFinish: () => void;
  onSipExitComplete: () => void;
  disabled?: boolean;
  /** 初回出現 — note 退場後の sip 表示時のみ */
  reveal?: boolean;
};

/** 録音画面下部 — note 同位置。上下ライン固定のままラベルだけ遷移 */
export function RecordBottomAction({
  textPhase,
  onSip,
  onFinish,
  onSipExitComplete,
  disabled = false,
  reveal = false,
}: RecordBottomActionProps) {
  const prefersReducedMotion = useReducedMotion();
  const instant = prefersReducedMotion === true;
  const t = RECORD_BOTTOM_ACTION_TUNING;
  const sipExitReportedRef = useRef(false);

  const contentStyle = {
    bottom: `${RECORD_COUNTER_BOTTOM_TUNING.bottomPaddingPercent}%`,
    transform: `translateY(${DRINK_NOTE_REVEAL_LAYOUT.offsetYRem}rem)`,
    paddingInline: `${DRINK_NOTE_REVEAL_LAYOUT.horizontalPaddingRem}rem`,
  } as CSSProperties;

  const actionStyle = {
    "--rb-max-width": `${DRINK_NOTE_REVEAL_LAYOUT.maxWidthRem}rem`,
    "--rb-line-gap": `${t.lineGapRem}rem`,
    "--rb-line-color": t.lineColor,
    "--rb-line-opacity": t.lineOpacity,
    "--rb-line-opacity-hover": t.lineOpacityHover,
    "--rb-text-color": t.textColor,
    "--rb-text-opacity": t.textOpacity,
    "--rb-text-opacity-hover": t.textOpacityHover,
    "--rb-text-brightness-hover": t.textBrightnessHover,
    "--rb-text-glow-hover": t.textGlowHover,
    "--rb-duration": `${t.transitionMs}ms`,
    "--rb-font-size": `${DRINK_NOTE_REVEAL_LAYOUT.sizeRem}rem`,
    "--rb-line-height": DRINK_NOTE_REVEAL_LAYOUT.lineHeight,
    "--rb-tracking": `${DRINK_NOTE_REVEAL_LAYOUT.letterSpacingEm}em`,
    "--rb-text-shadow": DRINK_NOTE_REVEAL_LAYOUT.textShadow,
  } as CSSProperties;

  const sipExitSec = instant ? 0 : t.sipExitMs / 1000;
  const finishEnterSec = instant ? 0 : t.finishEnterMs / 1000;

  const showSip = textPhase === "sip" || textPhase === "sip-exit";
  const showFinish = textPhase === "finish";
  const sipExiting = textPhase === "sip-exit";

  useEffect(() => {
    sipExitReportedRef.current = false;
  }, [textPhase]);

  const reportSipExitComplete = () => {
    if (sipExitReportedRef.current) return;
    sipExitReportedRef.current = true;
    onSipExitComplete();
  };

  useEffect(() => {
    if (!sipExiting || instant) {
      if (sipExiting && instant) {
        reportSipExitComplete();
      }
      return;
    }

    const timer = window.setTimeout(
      reportSipExitComplete,
      t.sipExitMs + t.finishEnterDelayMs,
    );

    return () => window.clearTimeout(timer);
  }, [instant, onSipExitComplete, sipExiting, t.finishEnterDelayMs, t.sipExitMs]);

  const handleClick = () => {
    if (disabled) return;
    if (textPhase === "sip") {
      onSip();
      return;
    }
    if (textPhase === "finish") {
      onFinish();
    }
  };

  const ariaLabel =
    textPhase === "finish" ? t.finishLabel : t.sipLabel;

  const inner = (
    <button
      type="button"
      className={styles.action}
      style={actionStyle}
      onClick={handleClick}
      disabled={disabled || sipExiting}
      aria-label={ariaLabel}
    >
      <RecordBottomActionDivider />
      <span className={styles.labelSlot}>
        {showSip && (
          <motion.span
            className={styles.label}
            initial={false}
            animate={{ opacity: sipExiting ? 0 : 1 }}
            transition={
              sipExiting
                ? {
                    duration: sipExitSec,
                    ease: DRINK_NAME_REVEAL_EASE.note,
                  }
                : { duration: 0 }
            }
            onAnimationComplete={() => {
              if (!sipExiting || sipExitReportedRef.current) return;
              window.setTimeout(
                reportSipExitComplete,
                instant ? 0 : t.finishEnterDelayMs,
              );
            }}
          >
            {t.sipLabel}
          </motion.span>
        )}
        {showFinish && (
          <motion.span
            className={styles.label}
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              instant
                ? { duration: 0 }
                : {
                    duration: finishEnterSec,
                    ease: DRINK_NAME_REVEAL_EASE.note,
                  }
            }
          >
            {t.finishLabel}
          </motion.span>
        )}
      </span>
      <RecordBottomActionDivider />
    </button>
  );

  return (
    <div className={styles.chrome}>
      <div className={styles.content} style={contentStyle}>
        {reveal ? (
          <Reveal
            drift
            delay={t.revealDelaySec}
            duration={t.revealDurationSec}
            className="w-full"
          >
            {inner}
          </Reveal>
        ) : (
          inner
        )}
      </div>
    </div>
  );
}
