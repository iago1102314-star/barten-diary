/**
 * 録音前チュートリアル — 初回のみ（localStorage）
 *
 * cardMaxWidthRem / cardPadding* — 紙カード
 * cardTiltDeg — メモの傾き
 * cardBrightness — 紙面の明るさ（1 未満でバー向けに落とす）
 * slide* — 入退場
 * scrimOpacity — 背景の黒レイヤー（メモ表示中のみ）
 * ack* — 「わかった」
 */
export const RECORDING_TUTORIAL_TUNING = {
  cardMaxWidthRem: 25.5,
  cardPaddingXRem: 1.75,
  cardPaddingYRem: 1.65,
  cardTiltDeg: -1.65,
  cardBrightness: 0.82,
  cardOffsetYRem: -1.25,

  titleFontSizeRem: 0.92,
  titleLetterSpacingEm: 0.12,
  bodyFontSizeRem: 0.88,
  bodyLineHeight: 2.08,
  bodyLetterSpacingEm: 0.05,

  slideFromYRem: -2.1,
  slideDurationSec: 0.58,

  scrimOpacity: 0.48,
  scrimFadeDurationSec: 0.48,

  closeDividerOpacity: 0.3,
  closeDividerMarginTopRem: 1.05,
  closeDividerMarginBottomRem: 0.55,
  closeFontSizeRem: 0.9125,
  closeLetterSpacingEm: 0.14,
  closeOpacity: 0.82,
} as const;
