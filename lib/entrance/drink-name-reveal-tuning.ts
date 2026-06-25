/** 酒名表示 — 明転完了を 0ms としたタイムライン（ms） */
export const DRINK_NAME_REVEAL_TIMING = {
  englishDurationMs: 500,
  englishTranslateYpx: 6,
  katakanaDelayMs: 180,
  katakanaDurationMs: 400,
  underlineDurationMs: 450,
} as const;

/** 下線 — カタカナのフェード完了後に開始 */
export function drinkNameRevealUnderlineDelayMs(): number {
  return (
    DRINK_NAME_REVEAL_TIMING.katakanaDelayMs +
    DRINK_NAME_REVEAL_TIMING.katakanaDurationMs
  );
}

export const DRINK_NAME_REVEAL_COLOR = {
  english: "rgba(245, 239, 228, 0.94)",
  katakana: "rgba(232, 212, 184, 0.72)",
  line: "rgba(232, 212, 184, 0.5)",
  lineDiamond: "rgba(232, 212, 184, 0.55)",
} as const;

export const DRINK_NAME_REVEAL_LAYOUT = {
  topPercent: 14,
  horizontalPaddingRem: 1.75,
  englishSizeClamp: "clamp(1.85rem, 7.2vw, 2.35rem)",
  englishLetterSpacingEm: 0.06,
  katakanaSizeRem: 0.72,
  katakanaLineHeight: 1.5,
  katakanaLetterSpacingEm: 0.14,
  englishToLineGapRem: 0.42,
  lineToKatakanaGapRem: 0.38,
} as const;

/** 過去のボトルから — 装飾線と同系のイージング */
export const DRINK_NAME_REVEAL_EASE = {
  english: [0.22, 0.61, 0.36, 1] as const,
  katakana: [0.22, 0.61, 0.36, 1] as const,
  underline: [0.22, 0.61, 0.36, 1] as const,
} as const;
