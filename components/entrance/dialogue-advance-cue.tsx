"use client";

import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { motion } from "motion/react";
import Image from "next/image";

type DialogueAdvanceCueProps = {
  visible: boolean;
};

/** タイプ完了後 — 吹き出し右下の次へ促す矢印 */
export function DialogueAdvanceCue({ visible }: DialogueAdvanceCueProps) {
  if (!visible) return null;

  const { advanceCue } = MASTER_DIALOGUE_TYPOGRAPHY;

  return (
    <motion.div
      className="pointer-events-none absolute right-3 bottom-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      aria-hidden
    >
      <motion.div
        animate={{ y: [0, -advanceCue.floatDistance, 0] }}
        transition={{
          duration: advanceCue.floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/vercel.svg"
          alt=""
          width={advanceCue.width}
          height={advanceCue.height}
          className="rotate-180 opacity-50"
        />
      </motion.div>
    </motion.div>
  );
}
