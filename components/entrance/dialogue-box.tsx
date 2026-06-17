"use client";

import { DialogueAdvanceCue } from "@/components/entrance/dialogue-advance-cue";
import {
  MASTER_DIALOGUE_TYPOGRAPHY,
  SHOW_DIALOGUE_ADVANCE_CUE,
} from "@/lib/entrance/master-dialogue-typography";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type DialogueBoxProps = {
  children: ReactNode;
  lineKey: number | string;
  label?: string;
  showAdvanceCue?: boolean;
};

/** マスター吹き出し — 画面端から端までの細い帯 */
export function DialogueBox({
  children,
  lineKey,
  label = "マスター",
  showAdvanceCue = false,
}: DialogueBoxProps) {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  const horizontalPadding = `${t.horizontalPaddingRem}rem`;
  const bodyIndent = `calc(${t.bodyTextIndentRem}rem + ${t.bodyTextIndentExtraPx}px)`;

  return (
    <motion.div
      key={lineKey}
      initial={{ opacity: 0, y: t.entranceOffsetYpx + t.dialogueBlockOffsetYpx }}
      animate={{ opacity: 1, y: t.dialogueBlockOffsetYpx }}
      transition={{ duration: t.entranceDurationSec }}
      className="relative box-border w-full min-w-full self-stretch"
      style={{
        paddingTop: `${t.bandPaddingTopRem}rem`,
        paddingBottom: `${t.bandPaddingBottomRem}rem`,
        backgroundColor: t.bandBackgroundColor,
        backdropFilter: `blur(${t.bandBackdropBlurPx}px)`,
      }}
    >
      <p
        className="font-serif-jp"
        style={{
          color: t.labelColor,
          fontSize: t.labelFontSize,
          letterSpacing: t.labelLetterSpacing,
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          paddingBottom: `${t.labelPaddingBottomRem}rem`,
        }}
      >
        {label}
      </p>

      <div
        className="relative flex items-start"
        style={{
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
        }}
      >
        <div
          className="shrink-0"
          style={{
            width: t.lineWidthPx,
            height: `${t.accentLineHeightRem}rem`,
            marginTop: `${t.accentLineTopRem}rem`,
            marginRight: `${t.lineGapRem}rem`,
            backgroundColor: t.labelColor,
          }}
          aria-hidden
        />
        <p
          className="flex-1 font-serif-jp"
          style={{
            color: t.bodyColor,
            fontSize: t.bodyFontSize,
            lineHeight: t.bodyLineHeight,
            letterSpacing: t.bodyLetterSpacing,
            minHeight: `${t.bodyMinHeightRem}rem`,
            marginLeft: bodyIndent,
            paddingRight: `${t.bodyPaddingRightRem}rem`,
            paddingBottom: `${t.bodyPaddingBottomRem}rem`,
          }}
        >
          {children}
        </p>
      </div>

      {showAdvanceCue && SHOW_DIALOGUE_ADVANCE_CUE && <DialogueAdvanceCue />}
    </motion.div>
  );
}
