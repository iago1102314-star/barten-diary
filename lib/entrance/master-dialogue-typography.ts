/**
 * マスター吹き出し（DialogueBox）— このファイルだけ触れば OK
 *
 * ═══════════════════════════════════════════════════════════
 *  吹き出し全体の縦位置（帯・ラベル・縦線・本文・三角マークが一体）
 * ═══════════════════════════════════════════════════════════
 *  dialoguePanelBottomPaddingRem  画面下端からの余白。小さいほど上へ
 *  dialogueBlockOffsetYpx           追加の縦ずらし（px）。負で上・正で下
 *
 * ═══════════════════════════════════════════════════════════
 *  しっぽり（タイプライター）速度
 * ═══════════════════════════════════════════════════════════
 *  typewriterSpeedMs        1文字あたりの間隔（ms）。大きいほどゆっくり
 *  typewriterDurationScale  全体の倍率（1.2 = 20% 遅く）
 *  目安: 総時間（秒）≈ 文字数 × typewriterSpeedMs × typewriterDurationScale / 1000
 *
 * ═══════════════════════════════════════════════════════════
 *  帯（セリフ背面の黒レイヤー・ぼかし）— DialogueBox
 * ═══════════════════════════════════════════════════════════
 *  bandBackgroundOpacity   黒レイヤーの不透明度（0〜1）。大きいほど暗い
 *  bandBackgroundRgb       黒レイヤーの色（スペース区切り rgb）。通常は 0 0 0
 *  bandBackdropBlurPx      背面のぼかし（px）。0 = ぼかしなし
 *  bandBackdropSaturate    背面の彩度（1 = 変更なし）。低いほどくすむ
 *  bandPaddingTopRem       帯の上パディング
 *  bandPaddingBottomRem    帯の下パディング
 *
 * ═══════════════════════════════════════════════════════════
 *  字間
 * ═══════════════════════════════════════════════════════════
 *  labelLetterSpacingEm  「マスター」ラベル（em）
 *  bodyLetterSpacingEm   セリフ本文（em）
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
  /** 字間（em）。大きいほど広い */
  labelLetterSpacingEm: 0.2,
  /** ラベルと本文ブロックの間（rem） */
  labelPaddingBottomRem: 0.325,

  /** セリフ本文 */
  bodyFontSize: "1.3rem",
  bodyLineHeight: 1.9,
  /** 字間（em）。大きいほど広い */
  bodyLetterSpacingEm: 0.05,
  /** 本文エリアの最小高さ（rem） */
  bodyMinHeightRem: 2.375,
  /** 縦線の右 — 本文をさらに右へ（rem） */
  bodyTextIndentRem: -1,
  /** 本文インデントの追加（px） */
  bodyTextIndentExtraPx: 50,
  /**
   * 1行目 — 左へ詰めきる下限（px）。
   * 0 = 縦線＋ gap の直後。負値 = gap 内へ寄せて縦線に近づける。
   */
  bodyTextIndentMinPx: -19,
  /** 1行目が溢れそうなとき、左インデントを1段ずつ詰める幅（px） */
  bodyTextIndentSqueezeStepPx: 3,
  /** 本文下の余白（rem） */
  bodyPaddingBottomRem: 0,
  /** 本文右側の空け（rem）— 折り返し・行幅の右限 */
  bodyPaddingRightRem: 1.5,

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

  /** 帯 — 黒レイヤー不透明度（0〜1） */
  bandBackgroundOpacity: 0.71,
  /** 帯 — 黒レイヤー色（rgb スペース区切り） */
  bandBackgroundRgb: "0 0 0",
  /** 帯の上下パディング（rem） */
  bandPaddingTopRem: 0.625,
  bandPaddingBottomRem: 0.5,
  /** 帯 — 背面ぼかし（px） */
  bandBackdropBlurPx: 2,
  /** 帯 — 背面彩度（1 = 変更なし） */
  bandBackdropSaturate: 1,

  /**
   * 吹き出し全体 — 画面下端からの余白（rem）。
   * 帯・「マスター」・縦線・本文・三角マークが一体で動く。
   */
  dialoguePanelBottomPaddingRem: 10,
  /** 吹き出し全体の追加縦ずらし（px）。負で上・正で下 */
  dialogueBlockOffsetYpx: 10,

  /** 吹き出し登場アニメ */
  entranceDurationSec: 0.6,
  entranceOffsetYpx: 12,

  /** 1文字あたりのタイプ表示間隔（ms） */
  typewriterSpeedMs: 95,
  /** タイプ速度の全体倍率（大きいほどゆっくり） */
  typewriterDurationScale: 1,

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

/** 帯 — 黒レイヤー背景色 */
export function masterDialogueBandBackgroundColor(): string {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  return `rgb(${t.bandBackgroundRgb} / ${t.bandBackgroundOpacity})`;
}

/** 帯 — backdrop-filter 値 */
export function masterDialogueBandBackdropFilter(): string {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  const parts: string[] = [];
  if (t.bandBackdropBlurPx > 0) {
    parts.push(`blur(${t.bandBackdropBlurPx}px)`);
  }
  if (t.bandBackdropSaturate !== 1) {
    parts.push(`saturate(${t.bandBackdropSaturate})`);
  }
  return parts.join(" ") || "none";
}

/** マスター吹き出しラッパー — 下端余白（帯ごと上へ移動） */
export function masterDialoguePanelWrapperStyle() {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  return {
    paddingBottom: `${t.dialoguePanelBottomPaddingRem}rem`,
  } as const;
}

/** しっぽり — 1文字ごとの待ち時間（ms） */
export function resolveMasterDialogueTypewriterSpeedMs(
  speedOverride?: number,
): number {
  const t = MASTER_DIALOGUE_TYPOGRAPHY;
  return (speedOverride ?? t.typewriterSpeedMs) * t.typewriterDurationScale;
}

/** しっぽり — セリフ全文の目安時間（ms） */
export function estimateMasterDialogueTypewriterDurationMs(
  text: string,
  speedOverride?: number,
): number {
  return text.length * resolveMasterDialogueTypewriterSpeedMs(speedOverride);
}
