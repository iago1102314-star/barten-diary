"use client";

import { DrinkNameRevealDivider } from "@/components/entrance/drink-name-reveal-divider";
import styles from "@/components/entrance/drink-name-reveal.module.css";
import type { Drink } from "@/lib/drinks/drink-catalog";
import { resolveDrinkNameRevealCopy } from "@/lib/drinks/drink-name-reveal-copy";
import { cormorantGaramondItalic } from "@/lib/entrance/drink-name-font";
import {
  DRINK_NAME_REVEAL_COLOR,
  DRINK_NAME_REVEAL_EASE,
  DRINK_NAME_REVEAL_LAYOUT,
  DRINK_NAME_REVEAL_TIMING,
} from "@/lib/entrance/drink-name-reveal-tuning";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, type CSSProperties } from "react";

type DrinkNameRevealProps = {
  drink: Pick<Drink, "id" | "name">;
  /** 明転完了後に表示 */
  visible?: boolean;
};

export function DrinkNameReveal({ drink, visible = true }: DrinkNameRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const copy = useMemo(() => resolveDrinkNameRevealCopy(drink), [drink]);
  const instant = prefersReducedMotion === true;
  const showKatakanaBlock = Boolean(copy.katakanaName);

  if (!visible) return null;

  const layoutStyle = {
    "--drink-name-top": `${DRINK_NAME_REVEAL_LAYOUT.topPercent}%`,
    "--drink-name-padding-inline": `${DRINK_NAME_REVEAL_LAYOUT.horizontalPaddingRem}rem`,
    "--drink-name-english-color": DRINK_NAME_REVEAL_COLOR.english,
    "--drink-name-english-size": DRINK_NAME_REVEAL_LAYOUT.englishSizeClamp,
    "--drink-name-english-tracking": `${DRINK_NAME_REVEAL_LAYOUT.englishLetterSpacingEm}em`,
    "--drink-name-katakana-color": DRINK_NAME_REVEAL_COLOR.katakana,
    "--drink-name-katakana-size": `${DRINK_NAME_REVEAL_LAYOUT.katakanaSizeRem}rem`,
    "--drink-name-katakana-line-height": DRINK_NAME_REVEAL_LAYOUT.katakanaLineHeight,
    "--drink-name-katakana-tracking": `${DRINK_NAME_REVEAL_LAYOUT.katakanaLetterSpacingEm}em`,
    "--drink-name-english-to-line-gap": `${DRINK_NAME_REVEAL_LAYOUT.englishToLineGapRem}rem`,
    "--drink-name-line-to-katakana-gap": `${DRINK_NAME_REVEAL_LAYOUT.lineToKatakanaGapRem}rem`,
  } as CSSProperties;

  const englishDurationSec = instant
    ? 0
    : DRINK_NAME_REVEAL_TIMING.englishDurationMs / 1000;
  const katakanaDelaySec = instant
    ? 0
    : DRINK_NAME_REVEAL_TIMING.katakanaDelayMs / 1000;
  const katakanaDurationSec = instant
    ? 0
    : DRINK_NAME_REVEAL_TIMING.katakanaDurationMs / 1000;

  return (
    <div className={styles.root} style={layoutStyle} aria-hidden>
      <div className={`${styles.inner} ${cormorantGaramondItalic.className}`}>
        <motion.p
          className={styles.englishName}
          initial={
            instant
              ? false
              : {
                  opacity: 0,
                  y: DRINK_NAME_REVEAL_TIMING.englishTranslateYpx,
                }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={
            instant
              ? { duration: 0 }
              : {
                  duration: englishDurationSec,
                  ease: DRINK_NAME_REVEAL_EASE.english,
                }
          }
        >
          {copy.englishName}
        </motion.p>

        {showKatakanaBlock && (
          <>
            <div className={styles.dividerWrap}>
              <DrinkNameRevealDivider instant={instant} />
            </div>

            <motion.p
              className={styles.katakanaName}
              initial={instant ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                instant
                  ? { duration: 0 }
                  : {
                      delay: katakanaDelaySec,
                      duration: katakanaDurationSec,
                      ease: DRINK_NAME_REVEAL_EASE.katakana,
                    }
              }
            >
              {copy.katakanaName}
            </motion.p>
          </>
        )}
      </div>
    </div>
  );
}
