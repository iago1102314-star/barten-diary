"use client";

import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";

/**
 * 入店時の暖色光ブルーム。
 * 暗転からカウンターが現れる瞬間、暖かい光がふわっと満ちて引く。
 * マウント時に一度だけ再生する想定（counterIntro の間だけ描画する）。
 */
export function WarmBloom() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[24]"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0] }}
      transition={{ duration: 2.6, ease: EASE_DRIFT, times: [0, 0.35, 1] }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 42%, rgba(214, 170, 104, 0.55), rgba(140, 96, 48, 0.18) 45%, transparent 72%)",
        }}
      />
    </motion.div>
  );
}
