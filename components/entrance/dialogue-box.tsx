"use client";

import { DialogueAdvanceCue } from "@/components/entrance/dialogue-advance-cue";
import { MasterDialogueBody } from "@/components/entrance/master-dialogue-body";
import type { MasterDialogueBodyHandle } from "@/components/entrance/master-dialogue-body";
import {
  MASTER_DIALOGUE_TYPOGRAPHY,
  masterDialogueBandBackdropFilter,
  masterDialogueBandBackgroundColor,
  SHOW_DIALOGUE_ADVANCE_CUE,
} from "@/lib/entrance/master-dialogue-typography";
import { motion } from "motion/react";
import type { ReactNode, RefObject } from "react";

type DialogueBoxProps = {
  /** タイプライター + 折り返しレイアウト用 */
  text?: string;
  typewriterSpeed?: number;
  onTypewriterDone?: () => void;
  children?: ReactNode;
  lineKey: number | string;
  label?: string;
  showAdvanceCue?: boolean;
  dialogueBodyRef?: RefObject<MasterDialogueBodyHandle | null>;
  initialShown?: string;
};

/** マスター吹き出し — 画面端から端までの細い帯 */
export function DialogueBox({
  text,
  typewriterSpeed,
  onTypewriterDone,
  children,
  lineKey,
  label = "マスター",
  showAdvanceCue = false,
  dialogueBodyRef,
  initialShown,
}: DialogueBoxProps) {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  const horizontalPadding = `${t.horizontalPaddingRem}rem`;
  const bandBackdropFilter = masterDialogueBandBackdropFilter();

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
        backgroundColor: masterDialogueBandBackgroundColor(),
        backdropFilter: bandBackdropFilter,
        WebkitBackdropFilter: bandBackdropFilter,
      }}
    >
      <p
        className="font-serif-jp"
        style={{
          color: t.labelColor,
          fontSize: t.labelFontSize,
          letterSpacing: `${t.labelLetterSpacingEm}em`,
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
        {text != null ? (
          <MasterDialogueBody
            ref={dialogueBodyRef}
            text={text}
            speed={typewriterSpeed}
            onDone={onTypewriterDone}
            initialShown={initialShown}
          />
        ) : (
          children
        )}
      </div>

      {showAdvanceCue && SHOW_DIALOGUE_ADVANCE_CUE && <DialogueAdvanceCue />}
    </motion.div>
  );
}
