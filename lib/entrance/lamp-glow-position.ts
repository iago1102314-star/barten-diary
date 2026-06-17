import type { CSSProperties } from "react";

/**
 * 親アンカー内の % 座標 — 中心点 (offsetX, offsetY)。
 * 赤点・光本体ともこの点を基準にする。
 */
export function lampGlowCenterPinStyle(
  offsetX: number,
  offsetY: number,
): CSSProperties {
  return {
    left: `${offsetX}%`,
    top: `${offsetY}%`,
    transform: "translate(-50%, -50%)",
  };
}

/**
 * 光本体 — 中心ピンに size / ratio だけ乗せる。
 * size = 親幅に対する %、ratio = 幅/高さ（1=円、<1=縦長）。
 * translate(-50%,-50%) が size/ratio 変化を吸収して中心を固定する。
 */
export function lampGlowCenteredLayoutStyle(
  offsetX: number,
  offsetY: number,
  size: number,
  ratio: number,
): CSSProperties {
  return {
    ...lampGlowCenterPinStyle(offsetX, offsetY),
    width: `${size}%`,
    aspectRatio: String(ratio),
  };
}

/** @deprecated lampGlowCenterPinStyle を使う */
export function lampGlowCenterAnchorStyle(
  offsetX: number,
  offsetY: number,
): CSSProperties {
  return lampGlowCenterPinStyle(offsetX, offsetY);
}
