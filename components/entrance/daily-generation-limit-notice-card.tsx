"use client";

import paperStyles from "@/components/diary-paper/diary-paper.module.css";
import styles from "@/components/entrance/recording-tutorial-card.module.css";
import { zenKurenaido } from "@/lib/diary-paper/diary-paper-font";
import { DAILY_GENERATION_LIMIT_NOTICE_TUNING as T } from "@/lib/entrance/daily-generation-limit-notice-tuning";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type CSSProperties } from "react";

type DailyGenerationLimitNoticeCardProps = {
  onDismiss: () => void;
};

/** 1日3件上限 — 暗転中の案内（チュートリアル同型・黒レイヤーなし・自動退場） */
export function DailyGenerationLimitNoticeCard({
  onDismiss,
}: DailyGenerationLimitNoticeCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const instant = prefersReducedMotion === true;
  const [mounted, setMounted] = useState(instant);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (instant) {
      setMounted(true);
      return;
    }
    const enterTimer = window.setTimeout(
      () => setMounted(true),
      T.cardEnterDelayMs,
    );
    return () => window.clearTimeout(enterTimer);
  }, [instant]);

  useEffect(() => {
    if (!mounted || !open) return;
    const dismissTimer = window.setTimeout(() => setOpen(false), T.autoDismissMs);
    return () => window.clearTimeout(dismissTimer);
  }, [mounted, open]);

  const stageStyle = {
    "--rt-card-offset-y": `${T.cardOffsetYRem}rem`,
    "--rt-card-max-width": `${T.cardMaxWidthRem}rem`,
  } as CSSProperties;

  const cardStyle = {
    "--rt-card-padding-x": `${T.cardPaddingXRem}rem`,
    "--rt-card-padding-y": `${T.cardPaddingYRem}rem`,
    "--rt-card-brightness": T.cardBrightness,
    "--rt-title-size": `${T.titleFontSizeRem}rem`,
    "--rt-title-tracking": `${T.titleLetterSpacingEm}em`,
    "--rt-body-tracking": `${T.bodyLetterSpacingEm}em`,
    "--diary-text-size": `${T.bodyFontSizeRem}rem`,
    "--diary-line-height": T.bodyLineHeight,
  } as CSSProperties;

  const cardMotionTransition = instant
    ? { duration: 0 }
    : { duration: T.slideDurationSec, ease: EASE_SOFT };

  const cardExitTarget = instant
    ? { opacity: 0 }
    : {
        opacity: 0,
        y: `calc(${T.slideFromYRem}rem + var(--rt-card-offset-y, 0rem))`,
      };

  if (!mounted) return null;

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {open ? (
        <motion.div
          key="daily-generation-limit-notice-card"
          className={styles.stage}
          style={stageStyle}
          role="status"
          aria-live="polite"
          aria-labelledby="daily-generation-limit-notice-title"
          initial={
            instant
              ? false
              : {
                  opacity: 0,
                  y: `calc(${T.slideFromYRem}rem + var(--rt-card-offset-y, 0rem))`,
                }
          }
          animate={{
            opacity: 1,
            y: "var(--rt-card-offset-y, 0rem)",
          }}
          exit={cardExitTarget}
          transition={cardMotionTransition}
        >
          <div
            className={styles.cardWrap}
            style={{ rotate: `${T.cardTiltDeg}deg` }}
          >
            <article
              className={`${paperStyles.paper} ${styles.card} ${zenKurenaido.className}`}
              style={cardStyle}
            >
              <h2
                id="daily-generation-limit-notice-title"
                className={styles.title}
              >
                {T.title}
              </h2>
              <div
                className={`${paperStyles.ruledBlock} ${styles.ruledBody}`}
              >
                {T.bodyParagraphs.map((paragraph) => (
                  <p key={paragraph} className={paperStyles.paragraph}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
