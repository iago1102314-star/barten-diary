"use client";

import { DrinkNameRevealDivider } from "@/components/entrance/drink-name-reveal-divider";
import { useCompactHeightViewport } from "@/hooks/use-compact-height-viewport";
import styles from "@/components/entrance/drink-name-reveal.module.css";
import type { Drink } from "@/lib/drinks/drink-catalog";
import { resolveDrinkNameRevealCopy } from "@/lib/drinks/drink-name-reveal-copy";
import { cormorantGaramondItalic } from "@/lib/entrance/drink-name-font";
import {
  DRINK_NAME_REVEAL_COLOR,
  DRINK_NAME_REVEAL_EASE,
  DRINK_NAME_REVEAL_TIMING,
  drinkNameRevealEnterDelaySec,
  drinkNameRevealEnterDurationSec,
  resolveDrinkNameRevealLayout,
  type DrinkNameRevealTimelineOrigin,
} from "@/lib/entrance/drink-name-reveal-tuning";
import { POST_RECORD_EXIT_TUNING } from "@/lib/entrance/post-record-exit-tuning";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, type CSSProperties } from "react";

type DrinkNameRevealProps = {
  drink: Pick<Drink, "id" | "name">;
  /** 明転完了後に表示 */
  visible?: boolean;
  /** 録音終了暗転とともにフェードアウト */
  exiting?: boolean;
  /** 明転開始と同時に入場タイムラインを走らせる */
  timelineOrigin?: DrinkNameRevealTimelineOrigin;
  /** 明転スキップ — 入場を即完了 */
  skipped?: boolean;
};

export function DrinkNameReveal({
  drink,
  visible = true,
  exiting = false,
  timelineOrigin = "reveal-complete",
  skipped = false,
}: DrinkNameRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const compactHeight = useCompactHeightViewport();
  const copy = useMemo(() => resolveDrinkNameRevealCopy(drink), [drink]);
  const layout = useMemo(
    () => resolveDrinkNameRevealLayout(drink.id, compactHeight),
    [drink.id, compactHeight],
  );
  const instant = prefersReducedMotion === true || skipped;
  const showKatakanaBlock = Boolean(copy.katakanaName);

  if (!visible) return null;

  const layoutStyle = {
    "--drink-name-top": `${layout.topPercent}%`,
    "--drink-name-padding-inline": `${layout.horizontalPaddingRem}rem`,
    "--drink-name-max-width": `${layout.maxWidthRem}rem`,
    "--drink-name-english-color": DRINK_NAME_REVEAL_COLOR.english,
    "--drink-name-english-size": layout.englishSizeClamp,
    "--drink-name-english-tracking": `${layout.englishLetterSpacingEm}em`,
    "--drink-name-katakana-color": DRINK_NAME_REVEAL_COLOR.katakana,
    "--drink-name-katakana-size": `${layout.katakanaSizeRem}rem`,
    "--drink-name-katakana-line-height": layout.katakanaLineHeight,
    "--drink-name-katakana-tracking": `${layout.katakanaLetterSpacingEm}em`,
    "--drink-name-english-to-line-gap": `${layout.englishToLineGapRem}rem`,
    "--drink-name-line-to-katakana-gap": `${layout.lineToKatakanaGapRem}rem`,
  } as CSSProperties;

  const englishDelaySec = instant
    ? 0
    : drinkNameRevealEnterDelaySec(0, timelineOrigin);
  const englishDurationSec = instant
    ? 0
    : drinkNameRevealEnterDurationSec(
        DRINK_NAME_REVEAL_TIMING.englishDurationMs,
        timelineOrigin,
      );
  const katakanaDelaySec = instant
    ? 0
    : drinkNameRevealEnterDelaySec(
        DRINK_NAME_REVEAL_TIMING.katakanaDelayMs,
        timelineOrigin,
      );
  const katakanaDurationSec = instant
    ? 0
    : drinkNameRevealEnterDurationSec(
        DRINK_NAME_REVEAL_TIMING.katakanaDurationMs,
        timelineOrigin,
      );
  const exitDurationSec = instant
    ? 0
    : POST_RECORD_EXIT_TUNING.softBlackFadeInMs / 1000;

  return (
    <motion.div
      className={styles.root}
      style={layoutStyle}
      aria-hidden
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={
        exiting
          ? { duration: exitDurationSec, ease: "easeOut" }
          : { duration: 0 }
      }
    >
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
                  delay: englishDelaySec,
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
              <DrinkNameRevealDivider
                instant={instant}
                timelineOrigin={timelineOrigin}
              />
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
    </motion.div>
  );
}
