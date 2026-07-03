import { RECORDING_TUTORIAL_TUNING } from "@/lib/entrance/recording-tutorial-tuning";

/**
 * 録音3分上限 — 暗転後の案内メモ（初回チュートリアルと同じカード演出・黒レイヤーなし）
 *
 * cardEnterDelayMs — 暗転開始からカード入場まで
 * autoDismissMs — カード表示後、自動退場まで
 * motion* — 未指定時は RECORDING_TUTORIAL_TUNING と同値
 */
export const RECORDING_LIMIT_NOTICE_TUNING = {
  title: "今夜はここまで。",
  bodyParagraphs: [
    "β版では一度のお話は3分までです。",
    "正式版ではより長くお話しいただける予定です。",
  ] as const,
  cardEnterDelayMs: 1000,
  autoDismissMs: 5000,

  cardMaxWidthRem: RECORDING_TUTORIAL_TUNING.cardMaxWidthRem,
  cardPaddingXRem: RECORDING_TUTORIAL_TUNING.cardPaddingXRem,
  cardPaddingYRem: RECORDING_TUTORIAL_TUNING.cardPaddingYRem,
  cardTiltDeg: RECORDING_TUTORIAL_TUNING.cardTiltDeg,
  cardBrightness: RECORDING_TUTORIAL_TUNING.cardBrightness,
  cardOffsetYRem: RECORDING_TUTORIAL_TUNING.cardOffsetYRem,

  titleFontSizeRem: RECORDING_TUTORIAL_TUNING.titleFontSizeRem,
  titleLetterSpacingEm: RECORDING_TUTORIAL_TUNING.titleLetterSpacingEm,
  bodyFontSizeRem: RECORDING_TUTORIAL_TUNING.bodyFontSizeRem,
  bodyLineHeight: RECORDING_TUTORIAL_TUNING.bodyLineHeight,
  bodyLetterSpacingEm: RECORDING_TUTORIAL_TUNING.bodyLetterSpacingEm,

  slideFromYRem: RECORDING_TUTORIAL_TUNING.slideFromYRem,
  slideDurationSec: RECORDING_TUTORIAL_TUNING.slideDurationSec,
} as const;
