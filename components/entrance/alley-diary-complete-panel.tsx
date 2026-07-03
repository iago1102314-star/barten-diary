"use client";

import { AlleyDiaryPaperPreview } from "@/components/entrance/alley-diary-paper-preview";
import styles from "@/components/entrance/alley-diary-complete-panel.module.css";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BarButton } from "@/components/ui/bar-button";
import { ALLEY_DIARY_COMPLETE_TUNING as T } from "@/lib/entrance/alley-diary-complete-tuning";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

type AlleyDiaryCompletePanelProps = {
  paper: DiaryPaperData;
  mode: "saved" | "needsLogin";
  onRead?: () => void;
  onDismiss: () => void;
  loginNext?: string;
};

const panelStyle = {
  gap: `${T.panelGapRem}rem`,
} as CSSProperties;

const messageStyle = {
  fontSize: `${T.messageFontSizePx}px`,
  lineHeight: T.messageLineHeight,
  letterSpacing: `${T.messageLetterSpacingEm}em`,
  color: T.messageColor,
  opacity: T.messageOpacity,
} as CSSProperties;

const loginHintStyle = {
  fontSize: `${T.loginHintFontSizePx}px`,
  lineHeight: T.loginHintLineHeight,
  letterSpacing: `${T.loginHintLetterSpacingEm}em`,
  color: T.loginHintColor,
  opacity: T.loginHintOpacity,
  paddingInline: `${T.loginHintPaddingXRem}rem`,
} as CSSProperties;

const ctaBlockStyle = {
  gap: `${T.ctaBlockGapRem}rem`,
  paddingTop: `${T.ctaBlockPaddingTopRem}rem`,
} as CSSProperties;

const savedActionsGroupStyle = {
  marginTop: `${T.savedActionsOffsetTopRem}rem`,
  gap: `${T.panelGapRem}rem`,
} as CSSProperties;

const dismissStyle = {
  fontSize: `${T.dismissFontSizePx}px`,
  letterSpacing: `${T.dismissLetterSpacingEm}em`,
  color: T.dismissColor,
  opacity: T.dismissOpacity,
} as CSSProperties;

const dismissWrapStyle = {
  paddingTop: `${T.dismissPaddingTopRem}rem`,
} as CSSProperties;

/** 帰り道 — 日記完成・プレビュー・CTA */
export function AlleyDiaryCompletePanel({
  paper,
  mode,
  onRead,
  onDismiss,
  loginNext = "/diaries",
}: AlleyDiaryCompletePanelProps) {
  const ctaBlock = (
    <motion.div
      className="flex w-full flex-col items-center"
      style={ctaBlockStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: T.ctaDurationSec,
        ease: EASE_SOFT,
        delay: T.ctaDelaySec,
      }}
    >
      {mode === "needsLogin" ? (
        <>
          <p
            className="font-serif-jp text-center font-normal"
            style={loginHintStyle}
          >
            ログインすると記録を保存できます。
          </p>
          <GoogleSignInButton
            next={loginNext}
            label="Googleでログインして読む"
            googleIconPosition="right"
            className="w-full"
          />
        </>
      ) : (
        <BarButton
          variant="primary"
          transparent
          onClick={() => onRead?.()}
          className={`w-full font-serif-jp ${styles.readRecordButton}`}
        >
          記録を読む
        </BarButton>
      )}
    </motion.div>
  );

  const dismissBlock = (
    <motion.div
      style={mode === "saved" ? undefined : dismissWrapStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: T.subCtaDurationSec,
        ease: EASE_SOFT,
        delay: T.subCtaDelaySec,
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="font-serif-jp transition-colors duration-500 hover:opacity-90"
        style={dismissStyle}
      >
        また今度読む
      </button>
    </motion.div>
  );

  return (
    <div className="flex w-full flex-col items-center" style={panelStyle}>
      <motion.p
        className="font-serif-jp text-center font-normal"
        style={messageStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: T.messageOpacity }}
        transition={{
          duration: T.messageDurationSec,
          ease: EASE_SOFT,
          delay: T.messageDelaySec,
        }}
      >
        今夜を記録に残しました。
      </motion.p>

      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: T.cardYOffsetPx }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: T.cardDurationSec,
          ease: EASE_SOFT,
          delay: T.cardDelaySec,
        }}
      >
        <AlleyDiaryPaperPreview paper={paper} />
      </motion.div>

      {mode === "saved" ? (
        <div className={styles.savedActionsGroup} style={savedActionsGroupStyle}>
          {ctaBlock}
          {dismissBlock}
        </div>
      ) : (
        <>
          {ctaBlock}
          {dismissBlock}
        </>
      )}
    </div>
  );
}
