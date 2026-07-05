/**
 * 気分選択 —「過去のボトルから」リンクの見た目・位置。
 * 調整はこのファイルだけ触ればよい。
 *
 * 高さ 699px 以下 — compact-height-viewport.ts の COMPACT_PAST_BOTTLE_LINK_OVERRIDES
 */

export const PAST_BOTTLE_LINK_TUNING = {
  /** 画面上部からの位置（%）— bar-seat-mood-picker の header 枠 */
  headerTopPercent: 10,

  /** テキスト — offset はアイコンごと一緒に動く */
  text: {
    fontSizePx: 23,
    letterSpacingEm: 0.2,
    color: "#B78A5A",
    /** リンク全体（アイコン＋文字）の位置調整（px） */
    offsetXpx: -76,
    offsetYpx: -35,
    /** 「過去のボトルから」文字のみ — アイコン・装飾線は動かさない */
    labelOffsetXpx: 64,
    /** 感情選択ラベルよりやや細め */
    fontWeight: 480,
  },

  /**
   * past アイコン — テキスト左に flex で相対配置。
   * text.offset を変えるとアイコンも一緒に動く。
   * icon.offset は文字に対する追加微調整のみ。
   */
  icon: {
    sizePx: 110,
    /** 表示サイズ倍率（0.9 = 90%）— past / past_hover 共通 */
    displayScale: 0.9,
    /** past のみ — 明度（1 = そのまま、0.7 ≒ 70%） */
    pastBrightness: 0.75,
    /** 文字との横間隔（px） */
    gapPx: 12,
    /** 文字行に対する追加オフセット（px） */
    offsetXpx: 75,
    offsetYpx: 0,
  },

  hover: {
    scale: 1.02,
    /** 拡大とアイコン切り替え — 同じ時間・イージング */
    durationMs: 200,
    ease: "easeInOut" as const,
  },

  /** 封蝋タップ — scale / brightness を 1 → min → 1 */
  tap: {
    scaleMin: 0.93,
    brightnessMin: 0.8,
    durationSec: 0.22,
    ease: "easeOut" as const,
  },

  /** タップ確定後、画面遷移まで — ホバー＋封蝋タップ演出を見せる */
  navigate: {
    delaySec: 0.28,
  },

  /**
   * タップ判定 — アイコン＋文字を1ボタンに統合。
   * padding* — 見た目の周囲に少しだけ余白を足す（負の margin でレイアウトは維持）
   */
  hit: {
    paddingXpx: 6,
    paddingYpx: 8,
  },

  /** 文字下の装飾ライン — 色は text.color。線の形状は mood-ornamental-divider-tuning.ts の pastBottle */
  divider: {
    marginTopPx: 6,
    /** ライン全体の位置（px） */
    offsetXpx: 40,
    offsetYpx: -12,
  },

  /**
   * 店内 → 気分選択 —「過去のボトルから」出現演出。
   * 封蝋 → 装飾線 → 文字（全体 ~850ms × MOOD_SELECT_ENTRANCE_DURATION_SCALE）。
   */
  entrance: {
    icon: {
      durationSec: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
      initialScale: 0.92,
      initialBlurPx: 6,
    },
    divider: {
      /** 封蝋出現から */
      delaySec: 0.18,
      durationSec: 0.4,
      ease: [0.22, 0.61, 0.36, 1] as const,
      initialOpacity: 0.2,
      finalOpacity: 0.55,
    },
    text: {
      /** 線が伸び始めてから */
      delayAfterDividerSec: 0.2,
      durationSec: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
      initialTranslateYPx: 4,
      initialBlurPx: 3,
      brightenPeak: 1.07,
      /** 表示完了後の明るさの余韻 */
      brightenDurationSec: 0.15,
    },
  },

  /** β版 — タップ時トースト（過去ボトル選択は未開放） */
  betaUnavailableNoticeText: "この機能は正式版でご利用いただけます。",
} as const;

/** 過去のボトルから / また今度にする — 共通テキストスタイル */
export function moodLinkTextStyle(
  text: typeof PAST_BOTTLE_LINK_TUNING.text = PAST_BOTTLE_LINK_TUNING.text,
) {
  return {
    fontSize: text.fontSizePx,
    letterSpacing: "var(--font-serif-jp-tracking)",
    color: text.color,
    fontWeight: text.fontWeight,
  } as const;
}
