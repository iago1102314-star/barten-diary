/**
 * 気分選択 — 装飾ライン SVG の形状。
 * 線の位置・長さ・太さはこのファイルだけ触ればよい。
 *
 * strokeWidth は 1 未満も可（例: 0.35, 0.5）。
 * viewBox 座標系での値 — 線とダイヤ（星）は別パラメータ。
 */

export const MOOD_ORNAMENTAL_DIVIDER_TUNING = {
  viewBoxWidth: 220,
  viewBoxHeight: 12,
  /** 線・ダイヤの縦位置（viewBox 内） */
  centerY: 6,

  /** 過去のボトルから — 下のライン（1本 + 右端ダイヤ） */
  pastBottle: {
    viewBoxMinX: -10,
    line: {
      /** 線の太さ — 1 より細くて OK（例: 0.5） */
      strokeWidth: 0.5,
      lineStartX: -10,
    },
    /** 右端ダイヤ — lineEndX = centerX + halfWidth で連動 */
    diamond: {
      centerX: 260,
      halfWidth: 4,
      halfHeight: 4,
    },
  },

  /**
   * 感情選択と「また今度にする」の間 — 2本線 + 中央ダイヤ
   */
  moodFooter: {
    line: {
      /** viewBox 高さ 12px 表示 — 0.5 未満は実質見えない */
      strokeWidth: 0.5,
      leftLineStartX: 31,
      leftLineEndX: 98,
      rightLineStartX: 122,
      rightLineEndX: 189,
    },
    diamond: {
      centerX: 110,
      halfWidth: 6,
      halfHeight: 6,
    },
  },
} as const;

/** 過去ボトル — 線端と星を同期した viewBox / 線座標 */
export function getPastBottleDividerMetrics() {
  const { viewBoxMinX, line, diamond } =
    MOOD_ORNAMENTAL_DIVIDER_TUNING.pastBottle;
  const lineEndX = diamond.centerX + diamond.halfWidth;

  return {
    viewBoxMinX,
    viewBoxWidth: lineEndX - viewBoxMinX,
    lineStartX: line.lineStartX,
    lineEndX,
    strokeWidth: line.strokeWidth,
    diamond,
  };
}

export function ornamentalDiamondPath(
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
): string {
  return `M${centerX - halfWidth} ${centerY}L${centerX} ${centerY - halfHeight}L${centerX + halfWidth} ${centerY}L${centerX} ${centerY + halfHeight}L${centerX - halfWidth} ${centerY}Z`;
}
