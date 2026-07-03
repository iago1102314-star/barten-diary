import type { BetaDrinkId } from "@/lib/drinks/drink-catalog";
import { resolveVisualDrinkId } from "@/lib/drinks/legacy-drink-map";
import { BAR_AUDIO_TIMING } from "@/lib/entrance/audio-levels";

/**
 * 酒名表示 UI（Bellini / 装飾線 / カタカナ）— このファイルだけ触れば OK
 *
 * ═══════════════════════════════════════════════════════════
 *  録音画面・下部共通 — RECORD_COUNTER_BOTTOM_TUNING
 * ═══════════════════════════════════════════════════════════
 *  bottomPaddingPercent  note /「口をつける」の下端位置（%）。小さいほど下
 *
 * ═══════════════════════════════════════════════════════════
 *  ブロック全体の位置・大きさ — DRINK_NAME_REVEAL_LAYOUT
 * ═══════════════════════════════════════════════════════════
 *  topPercent              画面上端からの位置（%）
 *  horizontalPaddingRem    左右余白
 *  maxWidthRem             ブロック最大幅
 *  englishSizeClamp        英語名の font-size（clamp 可）
 *  englishLetterSpacingEm
 *  englishToLineGapRem     英語名 → 装飾線
 *  lineToKatakanaGapRem    装飾線 → カタカナ
 *  katakanaSizeRem         カタカナ（ベリーニ等）の大きさ
 *  katakanaLineHeight
 *  katakanaLetterSpacingEm
 *
 * ═══════════════════════════════════════════════════════════
 *  note テキスト — DRINK_NOTE_REVEAL_LAYOUT
 * ═══════════════════════════════════════════════════════════
 *  offsetYRem        追加の縦ずらし（rem）。+ で下、− で上
 *  noteOpacity       note テキスト不透明度（0〜1）
 *  sizeRem / lineHeight / letterSpacingEm / maxWidthRem / textShadow
 *
 * ═══════════════════════════════════════════════════════════
 *  装飾線 — DRINK_NAME_REVEAL_DIVIDER
 * ═══════════════════════════════════════════════════════════
 *  widthPercent / maxWidthRem   線ブロックの幅
 *  viewBoxHeight                SVG の高さ（px）
 *  strokeWidth                  線の太さ
 *  lineStartX / diamondCenterX  線の長さ・ダイヤ位置（viewBox 座標）
 *  diamondHalfWidth/Height      右端ダイヤの大きさ
 *
 * ═══════════════════════════════════════════════════════════
 *  下部グラデ（黒レイヤー）— DRINK_NOTE_SCRIM_TUNING
 * ═══════════════════════════════════════════════════════════
 *  heightPercent     グラデ全体の高さ（画面下端から %）
 *  topOpacity        上端の強さ（0〜1）
 *  midStopPercent    中間ストップ位置（グラデ内 %・上→下）
 *  midOpacity        中間の強さ（0〜1）
 *  bottomOpacity     下端の強さ（0〜1）
 *
 * ═══════════════════════════════════════════════════════════
 *  下部アクション（口をつける / 今夜はここまで）— RECORD_BOTTOM_ACTION_TUNING
 * ═══════════════════════════════════════════════════════════
 *  lineColor / lineOpacity / textColor / textOpacity / transitionMs
 *  sipExitMs / finishEnterDelayMs / finishEnterMs
 *  line — 上下共通の装飾線（テーパー・ダイヤ・左右フェード）
 *
 * ═══════════════════════════════════════════════════════════
 *  酒ごと — DRINK_NAME_REVEAL_BY_DRINK（未指定は共通値）
 * ═══════════════════════════════════════════════════════════
 */

/** 酒名表示 — 明転完了を 0ms としたタイムライン（ms） */
export const DRINK_NAME_REVEAL_TIMING = {
  englishDurationMs: 500,
  englishTranslateYpx: 6,
  lineDelayMs: 160,
  katakanaDelayMs: 180,
  katakanaDurationMs: 400,
  underlineDurationMs: 450,
  noteDelayMs: 180,
  noteDurationMs: 400,
  /** タップ後の note 退場（入場より短く） */
  noteExitDurationMs: 220,
} as const;

/**
 * grass 後の明転中にタイトル / note の入場を始めるリード（ms）。
 * 各要素の終了時刻（明転完了基準）は固定のまま、開始だけ早める。
 */
export const DRINK_NAME_REVEAL_LEAD_MS = 1200;

/** 装飾線ダイヤ — 明転完了からの固定遅延（終了 709ms） */
const DRINK_NAME_REVEAL_DIAMOND_DELAY_FROM_REVEAL_COMPLETE_MS = 529;

export type DrinkNameRevealTimelineOrigin = "reveal-start" | "reveal-complete";

export function drinkNameRevealEnteringRevealTotalMs(): number {
  return (
    BAR_AUDIO_TIMING.counterRevealFadeDelayMs +
    BAR_AUDIO_TIMING.counterRevealFadeMs +
    BAR_AUDIO_TIMING.moodPromptDelayAfterRevealMs
  );
}

export function drinkNameRevealEnterDelaySec(
  delayFromRevealCompleteMs: number,
  origin: DrinkNameRevealTimelineOrigin,
): number {
  if (origin === "reveal-complete") {
    return delayFromRevealCompleteMs / 1000;
  }

  return (
    (drinkNameRevealEnteringRevealTotalMs() +
      delayFromRevealCompleteMs -
      DRINK_NAME_REVEAL_LEAD_MS) /
    1000
  );
}

export function drinkNameRevealEnterDurationSec(
  durationMs: number,
  origin: DrinkNameRevealTimelineOrigin,
): number {
  if (origin === "reveal-complete") {
    return durationMs / 1000;
  }

  return (durationMs + DRINK_NAME_REVEAL_LEAD_MS) / 1000;
}

export function drinkNameRevealDiamondDelaySec(
  origin: DrinkNameRevealTimelineOrigin,
): number {
  if (origin === "reveal-complete") {
    return DRINK_NAME_REVEAL_DIAMOND_DELAY_FROM_REVEAL_COMPLETE_MS / 1000;
  }

  return (
    (drinkNameRevealEnteringRevealTotalMs() +
      DRINK_NAME_REVEAL_DIAMOND_DELAY_FROM_REVEAL_COMPLETE_MS) /
    1000
  );
}

/** 装飾線 — 英語名表示開始からの遅延 */
export function drinkNameRevealUnderlineDelayMs(): number {
  return DRINK_NAME_REVEAL_TIMING.lineDelayMs;
}

/** note — 英語名表示開始からの遅延（タイトルと同タイミング帯） */
export function drinkNameRevealNoteDelayMs(): number {
  return DRINK_NAME_REVEAL_TIMING.noteDelayMs;
}

export const DRINK_NAME_REVEAL_COLOR = {
  english: "rgba(245, 239, 228, 0.94)",
  katakana: "rgba(232, 212, 184, 0.72)",
  line: "rgba(232, 212, 184, 0.78)",
  lineDiamond: "rgba(232, 212, 184, 0.82)",
  note: "rgb(232, 212, 184)",
} as const;

export const DRINK_NAME_REVEAL_LAYOUT = {
  topPercent: 14,
  horizontalPaddingRem: 1.75,
  maxWidthRem: 22,
  englishSizeClamp: "clamp(2.85rem, 7.2vw, 2.35rem)",
  englishLetterSpacingEm: 0.06,
  katakanaSizeRem: 1,
  katakanaLineHeight: 1.5,
  katakanaLetterSpacingEm: 0.14,
  englishToLineGapRem: 0.42,
  lineToKatakanaGapRem: 0.38,
} as const;

/** 録音画面下部 — note /「口をつける」の下端位置 */
export const RECORD_COUNTER_BOTTOM_TUNING = {
  /** 画面下端からの距離（%）。小さいほど下へ */
  bottomPaddingPercent: 10,
} as const;

/** 画面下部 — note テキスト（縦位置は RECORD_COUNTER_BOTTOM_TUNING） */
export const DRINK_NOTE_REVEAL_LAYOUT = {
  /** note テキスト不透明度（0〜1） */
  noteOpacity: 0.74,
  /** 追加の縦ずらし（rem）。+ で下、− で上 */
  offsetYRem: 0,
  horizontalPaddingRem: 1.25,
  sizeRem: 1.48,
  lineHeight: 1.65,
  letterSpacingEm: 0.08,
  maxWidthRem: 40,
  textShadow: "0 1px 6px rgba(0, 0, 0, 0.55)",
} as const;

/**
 * 録音画面下部の黒グラデ — RecordCounterScene 内 z=3（note 退場後も維持）
 */
export const DRINK_NOTE_SCRIM_TUNING = {
  /** グラデ全体の高さ（画面下端から %） */
  heightPercent: 23,
  /** 上端の強さ（0〜1） */
  topOpacity: 0,
  /** 中間ストップ位置（グラデ内 %・上→下） */
  midStopPercent: 20,
  /** 中間の強さ（0〜1） */
  midOpacity: 0.5,
  /** 下端の強さ（0〜1） */
  bottomOpacity: 1,
} as const;

export function buildDrinkNoteScrimGradient(
  tuning: typeof DRINK_NOTE_SCRIM_TUNING = DRINK_NOTE_SCRIM_TUNING,
) {
  const { topOpacity, midStopPercent, midOpacity, bottomOpacity } = tuning;

  return `linear-gradient(to bottom, rgba(0, 0, 0, ${topOpacity}) 0%, rgba(0, 0, 0, ${midOpacity}) ${midStopPercent}%, rgba(0, 0, 0, ${bottomOpacity}) 100%)`;
}

/** 録音画面下部アクション — note と同位置・同フォント */
export const RECORD_BOTTOM_ACTION_TUNING = {
  sipLabel: "口をつける",
  finishLabel: "今夜はここまで",
  lineColor: "#d8c6a3",
  lineOpacity: 0.3,
  lineOpacityHover: 0.5,
  textColor: "#d6d3d1",
  textOpacity: 0.85,
  textOpacityHover: 0.96,
  textBrightnessHover: 1.06,
  textGlowHover: "0 0 14px rgba(216, 198, 163, 0.2)",
  transitionMs: 300,
  lineGapRem: 0.72,
  /** 「口をつける」フェードアウト */
  sipExitMs: 720,
  /** 口をつける消失後、今夜はここまでが現れるまでの間（線だけ残す） */
  finishEnterDelayMs: 560,
  /** 「今夜はここまで」フェードイン */
  finishEnterMs: 800,
  /** 初回出現 — note 退場直後 */
  revealDelaySec: 0,
  revealDurationSec: 0.2,
  /** 上下ライン — 同一形状 */
  line: {
    maxWidthRem: 18,
    viewBoxWidth: 300,
    viewBoxHeight: 16,
    centerY: 8,
    edgeHalfHeight: 0.36,
    centerHalfHeight: 2.28,
    taperInflectPercent: 22,
    fadeInsetPercent: 12,
    diamondHalfWidth: 4.8,
    diamondHalfHeight: 4.8,
    diamondOpacity: 0.42,
  },
} as const;

/** @deprecated RECORD_BOTTOM_ACTION_TUNING を使用 */
export const DRINK_SIP_INVITE_TUNING = RECORD_BOTTOM_ACTION_TUNING;

export function buildRecordBottomTaperedLinePath(
  width: number,
  centerY: number,
  edgeHalfHeight: number,
  centerHalfHeight: number,
  taperInflectPercent: number,
): string {
  const mid = width / 2;
  const inflect = (width * taperInflectPercent) / 100;
  const edgeInner = edgeHalfHeight * 0.65;

  return [
    `M 0 ${centerY + edgeHalfHeight}`,
    `L ${mid - inflect} ${centerY + edgeInner}`,
    `L ${mid} ${centerY - centerHalfHeight}`,
    `L ${mid + inflect} ${centerY + edgeInner}`,
    `L ${width} ${centerY + edgeHalfHeight}`,
    `L ${width} ${centerY - edgeHalfHeight}`,
    `L ${mid + inflect} ${centerY - edgeInner}`,
    `L ${mid} ${centerY + centerHalfHeight}`,
    `L ${mid - inflect} ${centerY - edgeInner}`,
    `L 0 ${centerY - edgeHalfHeight}`,
    "Z",
  ].join(" ");
}

export const DRINK_NAME_REVEAL_DIVIDER = {
  widthPercent: 100,
  maxWidthRem: 18,
  viewBoxMinX: -10,
  viewBoxHeight: 12,
  centerY: 6,
  strokeWidth: 0.9,
  lineStartX: -10,
  diamondCenterX: 260,
  diamondHalfWidth: 4,
  diamondHalfHeight: 4,
  /** アニメ完了時の不透明度（0〜1） */
  lineOpacity: 0.88,
  lineDiamondOpacity: 0.9,
} as const;

export type DrinkNameRevealLayoutOverride = {
  [K in keyof typeof DRINK_NAME_REVEAL_LAYOUT]?: (typeof DRINK_NAME_REVEAL_LAYOUT)[K];
};

/** 酒ごとの位置・大きさ（必要なキーだけ上書き） */
export const DRINK_NAME_REVEAL_BY_DRINK = {
  "old-fashioned": {},
  koshu: {},
  bellini: {},
  "hot-cocoa": {},
} as const satisfies Record<BetaDrinkId, DrinkNameRevealLayoutOverride>;

/** 過去のボトルから — 装飾線と同系のイージング */
export const DRINK_NAME_REVEAL_EASE = {
  english: [0.22, 0.61, 0.36, 1] as const,
  katakana: [0.22, 0.61, 0.36, 1] as const,
  underline: [0.22, 0.61, 0.36, 1] as const,
  note: [0.22, 0.61, 0.36, 1] as const,
} as const;

export function getDrinkNameRevealDividerMetrics() {
  const d = DRINK_NAME_REVEAL_DIVIDER;
  const lineEndX = d.diamondCenterX + d.diamondHalfWidth;

  return {
    viewBoxMinX: d.viewBoxMinX,
    viewBoxWidth: lineEndX - d.viewBoxMinX,
    viewBoxHeight: d.viewBoxHeight,
    centerY: d.centerY,
    lineStartX: d.lineStartX,
    lineEndX,
    strokeWidth: d.strokeWidth,
    diamond: {
      centerX: d.diamondCenterX,
      halfWidth: d.diamondHalfWidth,
      halfHeight: d.diamondHalfHeight,
    },
  };
}

export function resolveDrinkNameRevealLayout(drinkId: string | null | undefined) {
  const visualId = resolveVisualDrinkId(drinkId);
  const override =
    visualId != null && visualId in DRINK_NAME_REVEAL_BY_DRINK
      ? DRINK_NAME_REVEAL_BY_DRINK[visualId as BetaDrinkId]
      : {};

  return { ...DRINK_NAME_REVEAL_LAYOUT, ...override };
}
