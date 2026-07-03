import { MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC } from "@/lib/entrance/mood-select-entrance-tuning";

/**
 * 気分選択画面 — 上下ビネット（影レイヤー）の見た目・位置。
 * 調整はこのファイルだけ触ればよい。
 *
 * 入場時間は MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC と同期（パララックスと同時完了）。
 */

/** 溶解〜明転シーンの全画面暗幕（上下ビネットと同系） */
export const MOOD_SELECT_BACKDROP_COLOR = "#120b08";

export const MOOD_VIGNETTE_TUNING = {
  /** entrance-flow — 黒ビネット shell（UI より下） */
  vignetteShellZIndex: 34,
  /** entrance-flow — 気分選択・過去ボトル UI shell */
  uiShellZIndex: 40,
  /** 入場演出連打スキップ — UI より下（ボタンを塞がない） */
  moodEntranceSkipZIndex: 33,
  /** 確定退場〜grass 再生前の連打スキップ */
  moodExitSkipZIndex: 41,
  /** grass 後〜口をつける前の連打スキップ */
  drinkPostGrassSkipZIndex: 45,
  /** entrance-flow —「過去のボトルから」リンク */
  pastBottleLinkZIndex: 45,
  /**
   * 確定感情ボタン — 中央移動・溶解（portal）
   * ビネット閉じ・暗幕・UI shell より上
   */
  moodConfirmExitZIndex: 50,

  /** 影レイヤー内部 z-index */
  layerZIndex: 2,
  /** BarSeatMoodPicker 内 UI の z-index */
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
    /** T=0 スタート — パララックスと同時完了 */
    delaySec: 0,
    durationSec: MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC,
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
   * 下部グラデ — 全レイヤー同一 duration（パララックスと同時完了）
   */
  bottomLayers: [
    { gradScale: 1.0, enterY: 48, delaySec: 0, durationSec: MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC },
    { gradScale: 0.85, enterY: 82, delaySec: 0, durationSec: MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC },
    { gradScale: 0.7, enterY: 122, delaySec: 0, durationSec: MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC },
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
