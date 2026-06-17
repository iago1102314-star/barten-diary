import type { StartLampGlowAnchor } from "@/lib/entrance/start-lamp-glows";
import type { LampBreatheProfile } from "@/lib/entrance/lamp-glow-breathe";

/**
 * 雨の路地 — 灯りの「呼吸」
 *
 * 暖色左右: 同一周期・同一位相・ランタン波形
 * 扉暖色: 同波形でより長い周期
 * 冷色2灯: 蛍光灯チラつき（別周期・別位相）
 * ネオン2灯: それぞれ別周期・別位相
 */

/** 暖色左右 — 完全同期 */
export const ALLEY_WARM_PAIR_PERIOD_SEC = 5.5;

/** 扉暖色 — 左右よりゆっくり（倍率） */
export const ALLEY_DOOR_WARM_PERIOD_MULTIPLIER = 2.2;

/** 冷色1（alley-cold）— 蛍光灯の時々チラつき */
export const ALLEY_COLD_1_BREATHE: LampBreatheProfile = {
  variant: "fluorescent",
  periodSec: 6.4,
  delaySec: 0,
  opacityDelta: 0.1,
  scaleDelta: 0.006,
};

/** 冷色2（alley-cold-2）— 同系統・別テンポ */
export const ALLEY_COLD_2_BREATHE: LampBreatheProfile = {
  variant: "fluorescent",
  periodSec: 5.1,
  delaySec: 2.7,
  opacityDelta: 0.08,
  scaleDelta: 0.005,
};

/** 看板ネオン — 個別 */
export const ALLEY_NEON_1_BREATHE: LampBreatheProfile = {
  variant: "neon",
  periodSec: 4.4,
  delaySec: 0,
  opacityDelta: 0.15,
  scaleDelta: 0.012,
};

export const ALLEY_NEON_2_BREATHE: LampBreatheProfile = {
  variant: "neon",
  periodSec: 8.2,
  delaySec: 1.9,
  opacityDelta: 0.11,
  scaleDelta: 0.018,
};

export function getStartLampBreatheProfile(
  anchor: StartLampGlowAnchor,
): LampBreatheProfile {
  switch (anchor) {
    case "alley-warm-left":
    case "alley-warm-right":
      return {
        variant: "lantern",
        periodSec: ALLEY_WARM_PAIR_PERIOD_SEC,
        delaySec: 0,
      };
    case "alley-door-warm":
      return {
        variant: "lantern",
        periodSec: ALLEY_WARM_PAIR_PERIOD_SEC * ALLEY_DOOR_WARM_PERIOD_MULTIPLIER,
        delaySec: 0,
      };
    case "alley-cold":
      return ALLEY_COLD_1_BREATHE;
    case "alley-cold-2":
      return ALLEY_COLD_2_BREATHE;
    case "alley-neon":
      return ALLEY_NEON_1_BREATHE;
    case "alley-neon-2":
      return ALLEY_NEON_2_BREATHE;
  }
}

/** @deprecated getStartLampBreatheProfile を使う */
export function getStartLampBreatheTiming(anchor: StartLampGlowAnchor) {
  const { periodSec, delaySec } = getStartLampBreatheProfile(anchor);
  return { periodSec, delaySec };
}
