"use client";

import { MASTER_DIALOGUE_TYPOGRAPHY } from "@/lib/entrance/master-dialogue-typography";
import { motion } from "motion/react";
import Image from "next/image";

/** タイプ完了後 — 帯右下の次へ促す矢印（本文エリア外） */
export function DialogueAdvanceCue() {
  const { advanceCue } = MASTER_DIALOGUE_TYPOGRAPHY;

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        right: `${advanceCue.rightRem}rem`,
        bottom: `${advanceCue.bottomRem}rem`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: advanceCue.fadeInDurationSec }}
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
          className="rotate-180"
          style={{ opacity: advanceCue.opacity }}
        />
      </motion.div>
    </motion.div>
  );
}
