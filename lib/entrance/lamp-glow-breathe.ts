import type { CounterLampGlowAnchor } from "@/lib/entrance/counter-lamp-glows";
import { lampGlowElementOpacity } from "@/lib/entrance/lamp-glow-visual";
import type { CSSProperties } from "react";

export type LampBreatheTiming = {
  periodSec: number;
  delaySec: number;
};

/** 呼吸の波形 — CSS keyframes セット */
export type LampBreatheVariant =
  | "lantern"
  | "street"
  | "fluorescent"
  | "neon";

export type LampBreatheProfile = LampBreatheTiming & {
  variant: LampBreatheVariant;
  opacityDelta?: number;
  scaleDelta?: number;
};

/**
 * カウンター店内 — 灯りの「呼吸」
 *
 * ランタン左右: 同一周期・同一位相（delay 0）
 * 背後右: 周期 = ランタン × backPeriodMultiplier、開始を backStartDelaySec だけずらす
 */

/** 左右ランタンの呼吸周期（秒）— 完全同期 */
export const LANTERN_BREATHE_PERIOD_SEC = 5.5;

/** 背後灯の周期倍率（ランタン比 2.2） */
export const BACK_LAMP_PERIOD_MULTIPLIER = 2.2;

/** 背後灯のアニメ開始遅延（秒）— ランタンと同時刻からずらす */
export const BACK_LAMP_START_DELAY_SEC = 2.4;

/** 不透明度の振れ幅 — 基準 opacity に対する ±（主役パラメータ） */
export const LAMP_BREATHE_OPACITY_DELTA = 0.14;

/** ごく弱いスケール呼吸（中心固定・位置は動かさない） */
export const LAMP_BREATHE_SCALE_DELTA = 0.025;

const BREATHE_CLASS: Record<LampBreatheVariant, string> = {
  lantern: "lamp-breathe",
  street: "lamp-breathe-street",
  fluorescent: "lamp-breathe-fluorescent",
  neon: "lamp-breathe-neon",
};

export function getLampBreatheClassName(
  variant: LampBreatheVariant = "lantern",
): string {
  return BREATHE_CLASS[variant];
}

export function getLampBreatheTiming(
  anchor: CounterLampGlowAnchor,
): LampBreatheTiming {
  if (anchor === "back-lamp") {
    return {
      periodSec: LANTERN_BREATHE_PERIOD_SEC * BACK_LAMP_PERIOD_MULTIPLIER,
      delaySec: BACK_LAMP_START_DELAY_SEC,
    };
  }

  return {
    periodSec: LANTERN_BREATHE_PERIOD_SEC,
    delaySec: 0,
  };
}

export function getCounterLampBreatheProfile(
  anchor: CounterLampGlowAnchor,
): LampBreatheProfile {
  return {
    ...getLampBreatheTiming(anchor),
    variant: "lantern",
  };
}

/** LampGlow に渡す CSS 変数（opacity 呼吸 + 微スケール） */
export function getLampBreatheStyleFromProfile(
  profile: LampBreatheProfile,
  intensity: number,
): CSSProperties {
  const baseOpacity = lampGlowElementOpacity(intensity);
  const delta = profile.opacityDelta ?? LAMP_BREATHE_OPACITY_DELTA;
  const scaleDelta = profile.scaleDelta ?? LAMP_BREATHE_SCALE_DELTA;
  const { periodSec, delaySec } = profile;

  return {
    ["--lamp-period" as string]: `${periodSec}s`,
    ["--lamp-delay" as string]: `${delaySec}s`,
    ["--lamp-op-min" as string]: String(Math.max(0.35, baseOpacity - delta)),
    ["--lamp-op-max" as string]: String(
      Math.min(1.85, baseOpacity + delta * 0.55),
    ),
    ["--lamp-scale-min" as string]: String(1 - scaleDelta),
    ["--lamp-scale-max" as string]: String(1 + scaleDelta * 0.6),
    opacity: baseOpacity,
  };
}

/** @deprecated getLampBreatheStyleFromProfile を使う */
export function getLampBreatheStyleFromTiming(
  timing: LampBreatheTiming,
  intensity: number,
): CSSProperties {
  return getLampBreatheStyleFromProfile(
    { ...timing, variant: "lantern" },
    intensity,
  );
}

/** @deprecated getLampBreatheStyleFromProfile を直接使う */
export function getLampBreatheStyle(
  anchor: CounterLampGlowAnchor | undefined,
  intensity: number,
  fallbackPeriodSec = 6,
): CSSProperties {
  const profile = anchor
    ? getCounterLampBreatheProfile(anchor)
    : {
        periodSec: fallbackPeriodSec,
        delaySec: 0,
        variant: "lantern" as const,
      };

  return getLampBreatheStyleFromProfile(profile, intensity);
}
