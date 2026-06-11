"use client";

import { DialogueAdvanceCue } from "@/components/entrance/dialogue-advance-cue";
import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type DialogueBoxProps = {
  children: ReactNode;
  /** セリフ切替時に motion / Typewriter をリセットするキー */
  lineKey: number | string;
  label?: string;
  /** タイプ完了後に次へ促す矢印を表示 */
  showAdvanceCue?: boolean;
};

/** マスター吹き出し — 半透明パネル＋名前ラベル */
export function DialogueBox({
  children,
  lineKey,
  label = "マスター",
  showAdvanceCue = false,
}: DialogueBoxProps) {
  return (
    <motion.div
      key={lineKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-md"
    >
      <p
        className="mb-2 text-[#d9a066]/70"
        style={{
          fontSize: MASTER_DIALOGUE_TYPOGRAPHY.labelFontSize,
          letterSpacing: MASTER_DIALOGUE_TYPOGRAPHY.labelLetterSpacing,
        }}
      >
        {label}
      </p>
      <p
        className="min-h-[3.5rem] font-serif-jp text-[#cdd6e8]"
        style={{
          fontSize: MASTER_DIALOGUE_TYPOGRAPHY.bodyFontSize,
          lineHeight: MASTER_DIALOGUE_TYPOGRAPHY.bodyLineHeight,
          letterSpacing: MASTER_DIALOGUE_TYPOGRAPHY.bodyLetterSpacing,
        }}
      >
        {children}
      </p>
      <DialogueAdvanceCue visible={showAdvanceCue} />
    </motion.div>
  );
}
