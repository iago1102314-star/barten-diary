import {
  MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC,
  MOOD_SELECT_UI_ANIM_SPEED_FACTOR,
} from "@/lib/entrance/mood-select-entrance-tuning";

/**
 * 気分選択 — 確定後の退場演出タイミング（秒 @ MOOD_SELECT_ENTRANCE_DURATION_SCALE 適用前）。
 */
export const MOOD_SELECT_EXIT_TUNING = {
  /** 非選択 UI の逆再生 — 入場と同じ速度（picker 側で entrance 定数を流用） */
  uiReverseUsesEntranceTiming: true,
  /** 非選択 UI 退場 — MOOD_SELECT_UI_ANIM_SPEED_FACTOR と同期 */
  uiReverseSpeedFactor: MOOD_SELECT_UI_ANIM_SPEED_FACTOR,

  /** 上下ビネット — 中央へ覆い尽くす（入場と同秒数） */
  vignetteCloseDurationSec: MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC,
  /** 退場時 — 上下帯が中央へ伸びる倍率 */
  vignetteCloseScaleY: 3.2,

  /** 選ばれたボタン — 画面中央へ */
  buttonMoveToCenterSec: 0.48,
  /** 移動先 — 画面中央からの Y オフセット（px・負で上） */
  buttonMoveCenterOffsetYpx: -220,
  /** 溶解開始 — 移動完了の何秒前から（正 = 早めに開始） */
  buttonDissolveLeadSec: 0.25,
  /** 闇に溶ける */
  buttonDissolveSec: 0.43,
  buttonDissolveScale: 0.98,
  buttonDissolveBlurPx: 6,

  /** grass 終了待ち — onended 欠落時（iOS 等）。入場 scale は掛けない（音源長ベース） */
  grassFallbackDurationSec: 2.8,
} as const;
