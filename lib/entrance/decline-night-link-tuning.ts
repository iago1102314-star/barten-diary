/**
 * 気分選択 —「また今度にする」リンクの見た目・位置。
 * 調整はこのファイルだけ触ればよい。
 */

export const DECLINE_NIGHT_LINK_TUNING = {
  /** 上の線と「また今度にする」文字の不透明度（0–1） */
  opacity: 0.7,
  /** ホバー時の不透明度（0–1） */
  hoverOpacity: 0.92,

  text: {
    fontSizePx: 17,
    letterSpacingEm: 0.2,
    color: "#B78A5A",
    offsetXpx: 0,
    offsetYpx: 0,
  },

  back: {
    sizePx: 13.2,
    offsetXpx: 0,
    offsetYpx: 0,
    gapPx: 10,
    opacity: 0.7,
    hoverOpacity: 0.92,
  },

  hover: {
    durationSec: 0.2,
  },

  /** タップ — 縮小なし。opacity / 文字色のみ */
  tap: {
    opacity: 1,
    color: "#D4A574",
  },

  /** 上の装飾ライン — 形状は mood-ornamental-divider-tuning.ts の moodFooter */
  divider: {
    marginBottomPx: 8,
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
