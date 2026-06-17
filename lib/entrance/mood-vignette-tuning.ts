/**
 * 気分選択画面 — 上下ビネット（影レイヤー）の見た目・位置。
 * 調整はこのファイルだけ触ればよい。
 *
 * 5 ゾーン構成:
 * ─ 上固定帯（top.fixedPx）
 * ─ 上グラデ（top.color → 透明, top.gradPx）
 * ─ 中クリア（何もなし）
 * ─ 下グラデ（透明 → bottom.color, bottom.gradPx）
 * ─ 下固定帯（bottom.fixedPx）
 */

export const MOOD_VIGNETTE_TUNING = {
  /** 影レイヤーの z-index（UI は uiLayerZIndex でこれより上） */
  layerZIndex: 2,
  /** ボタン・リンク等 UI の z-index */
  uiLayerZIndex: 10,

  top: {
    /** 上固定帯＋上グラデの色（#140904 = 暖かい暗色） */
    color: "#120b08",
    /** 上端の固定帯の高さ（px） */
    fixedPx: 110,
    /** 固定帯の下 — グラデーション帯の高さ（px） */
    gradPx: 120,
    /**
     * 固定帯の不透明度（0–1）。
     * 1 に近いほど濃い。グラデ起点も同じ値を使う。
     */
    opacity: 0.98,
    /** 入場 — 上から滑り込む開始オフセット（px） */
    enterY: -100,
    delaySec: 0.3,
    durationSec: 1.2,
  },

  bottom: {
    /** 下固定帯＋下グラデの色 */
    color: "#120b08",
    /** 下端の固定帯の高さ（px） */
    fixedPx: 250,
    /** 固定帯の上 — グラデーション帯の高さ（px） */
    gradPx: 350,
    /** 固定帯の不透明度（0–1）。グラデ起点も同じ値 */
    opacity: 1,
  },

  /**
   * 下部グラデ — 複数レイヤーが異なる速度で下から滑り込む。
   * gradScale: bottom.gradPx に対する倍率（1 = そのまま、0.85 = 15% 浅い）
   * enterY: 開始位置（px・下方向）
   * delaySec / durationSec: 入場タイミング
   */
  bottomLayers: [
    { gradScale: 1.0, enterY: 48, delaySec: 0.2, durationSec: 1.4 },
    { gradScale: 0.85, enterY: 82, delaySec: 0.05, durationSec: 2.0 },
    { gradScale: 0.7, enterY: 122, delaySec: 0.0, durationSec: 2.7 },
  ],
} as const;

/** #RRGGBB → rgba(r,g,b,a) */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
