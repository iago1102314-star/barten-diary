/**
 * 気分選択 — 装飾ライン SVG の形状。
 * 線の位置・長さはこのファイルだけ触ればよい。
 */

export const MOOD_ORNAMENTAL_DIVIDER_TUNING = {
  viewBoxWidth: 220,
  viewBoxHeight: 12,
  /** 線・ダイヤの縦位置（viewBox 内） */
  centerY: 6,

  /** 過去のボトルから — 下のライン（1本 + 右端ダイヤ） */
  pastBottle: {
    /** 線の太さ（viewBox 内） */
    strokeWidth: 1,
    lineStartX: -40,
    lineEndX: 205,
    diamondCenterX: 214,
    diamondHalfWidth: 4,
    diamondHalfHeight: 4,
  },

  /**
   * 感情選択と「また今度にする」の間 — 2本線 + 中央ダイヤ
   * leftLineEndX / rightLineStartX の差が中央の隙間幅
   */
  moodFooter: {
    /** 線の太さ（viewBox 内） */
    strokeWidth: 1,
    leftLineStartX: 0,
    leftLineEndX: 98,
    rightLineStartX: 122,
    rightLineEndX: 220,
    diamondCenterX: 110,
    diamondHalfWidth: 6,
    diamondHalfHeight: 6,
  },
} as const;

export function ornamentalDiamondPath(
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
): string {
  return `M${centerX - halfWidth} ${centerY}L${centerX} ${centerY - halfHeight}L${centerX + halfWidth} ${centerY}L${centerX} ${centerY + halfHeight}L${centerX - halfWidth} ${centerY}Z`;
}
