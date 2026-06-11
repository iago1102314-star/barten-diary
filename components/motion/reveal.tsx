"use client";

import { DURATION, EASE_SOFT, fadeUpVariants } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** 表示までの遅延（秒） */
  delay?: number;
  /** 立ち上がりの長さ（秒） */
  duration?: number;
  /** 下からの立ち上げを止めて、その場で滲ませる */
  drift?: boolean;
};

/**
 * 「静かに立ち上がる」共通の表示ラッパー。
 * マウント時に一度だけ再生する。
 */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = DURATION.line,
  drift = false,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={
        drift
          ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
          : fadeUpVariants
      }
      transition={{ duration, ease: EASE_SOFT, delay }}
    >
      {children}
    </motion.div>
  );
}
