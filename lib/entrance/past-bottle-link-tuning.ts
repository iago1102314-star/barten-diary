/**
 * 気分選択 —「過去のボトルから」リンクの見た目・位置。
 * 調整はこのファイルだけ触ればよい。
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
    offsetXpx: -18,
    offsetYpx: -40,
  },

  /**
   * past アイコン — テキスト左に flex で相対配置。
   * text.offset を変えるとアイコンも一緒に動く。
   * icon.offset は文字に対する追加微調整のみ。
   */
  icon: {
    sizePx: 110,
    /** 文字との横間隔（px） */
    gapPx: 12,
    /** 文字行に対する追加オフセット（px） */
    offsetXpx: 60,
    offsetYpx: 0,
    crossfadeMs: 200,
  },

  hover: {
    scale: 1.02,
  },

  /** 文字下の装飾ライン — 色は text.color を使う */
  divider: {
    marginTopPx: 6,
  },
} as const;

/** 過去のボトルから / また今度にする — 共通テキストスタイル */
export function moodLinkTextStyle(
  text: typeof PAST_BOTTLE_LINK_TUNING.text = PAST_BOTTLE_LINK_TUNING.text,
) {
  return {
    fontSize: text.fontSizePx,
    letterSpacing: `${text.letterSpacingEm}em`,
    color: text.color,
  } as const;
}
