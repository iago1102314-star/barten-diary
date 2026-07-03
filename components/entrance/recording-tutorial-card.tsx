"use client";

import paperStyles from "@/components/diary-paper/diary-paper.module.css";
import styles from "@/components/entrance/recording-tutorial-card.module.css";
import { unlockBarAudioForUserGesture } from "@/lib/entrance/bar-audio-engine";
import { zenKurenaido } from "@/lib/diary-paper/diary-paper-font";
import { RECORDING_TUTORIAL_TUNING as T } from "@/lib/entrance/recording-tutorial-tuning";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties } from "react";

type RecordingTutorialCardProps = {
  onDismiss: () => void;
};

/** 初回 — 口をつける前の録音説明（紙メモ風） */
export function RecordingTutorialCard({ onDismiss }: RecordingTutorialCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const instant = prefersReducedMotion === true;
  const [open, setOpen] = useState(true);

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
    "--rt-close-divider-opacity": T.closeDividerOpacity,
    "--rt-close-divider-mt": `${T.closeDividerMarginTopRem}rem`,
    "--rt-close-divider-mb": `${T.closeDividerMarginBottomRem}rem`,
    "--rt-close-size": `${T.closeFontSizeRem}rem`,
    "--rt-close-tracking": `${T.closeLetterSpacingEm}em`,
    "--rt-close-opacity": T.closeOpacity,
    "--diary-text-size": `${T.bodyFontSizeRem}rem`,
    "--diary-line-height": T.bodyLineHeight,
  } as CSSProperties;

  const handleDismiss = () => {
    unlockBarAudioForUserGesture();
    setOpen(false);
  };

  const scrimTransition = instant
    ? { duration: 0 }
    : { duration: T.scrimFadeDurationSec, ease: EASE_SOFT };

  const cardMotionTransition = instant
    ? { duration: 0 }
    : { duration: T.slideDurationSec, ease: EASE_SOFT };

  const cardExitTarget = instant
    ? { opacity: 0 }
    : {
        opacity: 0,
        y: `calc(${T.slideFromYRem}rem + var(--rt-card-offset-y, 0rem))`,
      };

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {open ? (
        <>
          <motion.div
            key="recording-tutorial-scrim"
            className={styles.scrim}
            style={{ "--rt-scrim-opacity": T.scrimOpacity } as CSSProperties}
            initial={{ opacity: instant ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={scrimTransition}
            aria-hidden
          />
          <motion.div
            key="recording-tutorial-card"
            className={styles.stage}
            style={stageStyle}
            role="dialog"
            aria-modal="false"
            aria-labelledby="recording-tutorial-title"
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
                <h2 id="recording-tutorial-title" className={styles.title}>
                  今夜の記録
                </h2>
                <div
                  className={`${paperStyles.ruledBlock} ${styles.ruledBody}`}
                >
                  <p className={paperStyles.paragraph}>
                    「口をつける」と押すと録音が始まります。
                  </p>
                  <p className={paperStyles.paragraph}>
                    今日のことを話し終えると、
                    <br />
                    今夜の日記になります。
                  </p>
                </div>
                <div className={styles.closeSection}>
                  <div className={styles.closeDivider} aria-hidden />
                  <button
                    type="button"
                    className={styles.closeLink}
                    onClick={handleDismiss}
                  >
                    わかった
                  </button>
                </div>
              </article>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
