import { EASE_DRIFT } from "@/lib/entrance/motion-presets";

/** 帰り道背景 — 路地が明ける演出 */
export const AFTER_NIGHT_BACKDROP_TUNING = {
  initialOpacity: 0,
  initialScale: 1.06,
  animateOpacity: 1,
  animateScale: 1.02,
  opacityDurationSec: 3,
  scaleDurationSec: 30,
  ease: EASE_DRIFT,
} as const;
