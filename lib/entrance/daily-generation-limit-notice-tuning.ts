import { RECORDING_TUTORIAL_TUNING } from "@/lib/entrance/recording-tutorial-tuning";
import {
  DAILY_GENERATION_LIMIT_BODY,
  DAILY_GENERATION_LIMIT_TITLE,
} from "@/lib/night/daily-generation-limit";

/** 1日3件上限 — 暗転後の案内メモ（録音上限カードと同型） */
export const DAILY_GENERATION_LIMIT_NOTICE_TUNING = {
  title: DAILY_GENERATION_LIMIT_TITLE,
  bodyParagraphs: [DAILY_GENERATION_LIMIT_BODY] as const,
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
