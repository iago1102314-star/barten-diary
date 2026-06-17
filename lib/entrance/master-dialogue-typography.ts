/**
 * マスター吹き出し（DialogueBox）の見た目パラメータ。
 * セリフ UI の調整はこのファイルだけ触ればよい。
 */

/** 一時 OFF — 次へ促す vercel 矢印 */
export const SHOW_DIALOGUE_ADVANCE_CUE = true;

export const MASTER_DIALOGUE_TYPOGRAPHY = {
  /** 「マスター」ラベル・縦線 — 琥珀とクリームの中間 */
  labelColor: "rgba(227, 194, 156, 0.81)",
  /** セリフ本文の色 */
  bodyColor: "#cdd6e8",

  /** 「マスター」ラベル */
  labelFontSize: "1.0rem",
  labelLetterSpacing: "0.3em",
  /** ラベルと本文ブロックの間（rem） */
  labelPaddingBottomRem: 0.625,

  /** セリフ本文 */
  bodyFontSize: "1.2rem",
  bodyLineHeight: 1.9,
  bodyLetterSpacing: "0.2em",
  /** 本文エリアの最小高さ（rem） */
  bodyMinHeightRem: 2.375,
  /** 縦線の右 — 本文をさらに右へ（rem） */
  bodyTextIndentRem: 0.5,
  /** 本文インデントの追加（px） */
  bodyTextIndentExtraPx: 50,
  /** 本文下の余白（rem） */
  bodyPaddingBottomRem: 0,
  /** 矢印用 — 本文右側の空け（rem） */
  bodyPaddingRightRem: 2.75,

  /** 左右余白（rem） */
  horizontalPaddingRem: 1.75,
  /** 縦線と本文の間隔（rem） */
  lineGapRem: 0.75,
  /** 縦線の太さ（px） */
  lineWidthPx: 0.9,
  /** 縦線の高さ（rem）— 本文ブロックより短く */
  accentLineHeightRem: 1.8,
  /** 縦線の上オフセット（rem）— 1行目に揃える */
  accentLineTopRem: 0.2,

  /** 帯の背景色 — やや透ける黒 */
  bandBackgroundColor: "rgba(0, 0, 0, 0.28)",
  /** 帯の上下パディング（rem） */
  bandPaddingTopRem: 0.625,
  bandPaddingBottomRem: 0.5,
  /** 帯のぼかし（px） */
  bandBackdropBlurPx: 2,

  /** 吹き出し全体 — 正で下・負で上（px） */
  dialogueBlockOffsetYpx: +10,

  /** 吹き出し登場アニメ */
  entranceDurationSec: 0.6,
  entranceOffsetYpx: 12,

  /** 1文字あたりのタイプ表示間隔（ms） */
  typewriterSpeedMs: 95,

  /** 吹き出し右下の次へ促す矢印 — 帯の右下（本文と被らない位置） */
  advanceCue: {
    width: 14,
    height: 12,
    rightRem: 1.75,
    bottomRem: 0.875,
    fadeInDurationSec: 0.45,
    floatDistance: 5,
    floatDuration: 2.2,
    opacity: 0.5,
  },
} as const;
