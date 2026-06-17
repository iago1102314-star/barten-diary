/**
 * 気分選択 —「また今度にする」リンクの見た目・位置。
 * 調整はこのファイルだけ触ればよい。
 */

export const DECLINE_NIGHT_LINK_TUNING = {
  text: {
    fontSizePx: 17,
    letterSpacingEm: 0.2,
    color: "#B78A5A",
    /** ボタン内での文字位置（px） */
    offsetXpx: 0,
    offsetYpx: 0,
  },

  /** back アイコン — 文字左 */
  back: {
    sizePx: 17,
    /** 文字に対する追加オフセット（px） */
    offsetXpx: 0,
    offsetYpx: 0,
    /** アイコンと文字の間隔（px） */
    gapPx: 10,
    /** 通常時の不透明度（0–1） */
    opacity: 0.7,
    /** ホバー時の不透明度（0–1） */
    hoverOpacity: 0.9,
  },

  /** 上の装飾ライン（moodFooter SVG）— 線の形状は mood-ornamental-divider-tuning.ts */
  divider: {
    marginBottomPx: 8,
    /** ライン全体の位置（px） */
    offsetXpx: 0,
    offsetYpx: 10,
  },
} as const;

export function declineLinkTextStyle(
  text: typeof DECLINE_NIGHT_LINK_TUNING.text = DECLINE_NIGHT_LINK_TUNING.text,
) {
  return {
    fontSize: text.fontSizePx,
    letterSpacing: `${text.letterSpacingEm}em`,
    color: text.color,
    transform: `translate(${text.offsetXpx}px, ${text.offsetYpx}px)`,
  } as const;
}
