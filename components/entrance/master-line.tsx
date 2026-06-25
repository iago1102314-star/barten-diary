"use client";

import { DURATION, EASE_SOFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";

type MasterLineProps = {
  children: string;
  className?: string;
  /** 立ち上がりまでの遅延（秒） */
  delay?: number;
};

/** マスターのセリフ — 夜の声のように静かに立ち上がる */
export function MasterLine({
  children,
  className = "",
  delay = 0,
}: MasterLineProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.line, ease: EASE_SOFT, delay }}
      className={`font-serif-jp text-center text-[16px] leading-relaxed text-stone-100/92 drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] ${className}`}
    >
      {children}
    </motion.p>
  );
}
