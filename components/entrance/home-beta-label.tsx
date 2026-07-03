"use client";

import { HOME_BETA_LABEL_TUNING } from "@/lib/entrance/home-beta-label-tuning";
import { cormorantGaramondItalic } from "@/lib/entrance/drink-name-font";
import {
  START_ENTRY_BUTTONS_DELAY_MS,
} from "@/lib/entrance/start-entry-timing";
import { motion } from "motion/react";

type HomeBetaLabelProps = {
  visible: boolean;
  isSteadyReturn?: boolean;
  interactionLocked?: boolean;
};

/** ホーム定常 — 左下 Beta（入場はカウンターへ / 記録を開くと同タイミング） */
export function HomeBetaLabel({
  visible,
  isSteadyReturn = false,
  interactionLocked = false,
}: HomeBetaLabelProps) {
  if (!HOME_BETA_LABEL_TUNING.enabled) return null;

  const t = HOME_BETA_LABEL_TUNING;
  const transition = isSteadyReturn
    ? { duration: 0 }
    : {
        duration: interactionLocked ? 0.35 : 1.4,
        delay: visible ? START_ENTRY_BUTTONS_DELAY_MS / 1000 : 0,
      };

  return (
    <motion.p
      initial={isSteadyReturn ? false : { opacity: 0 }}
      animate={{ opacity: visible ? t.opacity : 0 }}
      transition={transition}
      className={`${cormorantGaramondItalic.className} pointer-events-none absolute z-30 whitespace-nowrap`}
      style={{
        left: `${t.leftPercent}%`,
        bottom: `${t.bottomPercent}%`,
        color: t.color,
        fontSize: `${t.fontSizePx}px`,
        letterSpacing: `${t.letterSpacingEm}em`,
      }}
      aria-hidden
    >
      {t.text}
    </motion.p>
  );
}
