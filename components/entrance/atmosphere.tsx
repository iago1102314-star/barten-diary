"use client";

import {
  getCounterLampBreatheProfile,
  getLampBreatheClassName,
  getLampBreatheStyleFromProfile,
  type LampBreatheProfile,
  type LampBreatheTiming,
} from "@/lib/entrance/lamp-glow-breathe";
import { resolveLampGlowRgb } from "@/lib/entrance/lamp-glow-color";
import {
  buildLampGlowBackground,
  lampGlowElementOpacity,
} from "@/lib/entrance/lamp-glow-visual";
import { lampGlowCenteredLayoutStyle } from "@/lib/entrance/lamp-glow-position";
import type { CounterLampGlowAnchor } from "@/lib/entrance/counter-lamp-glows";
import type { CSSProperties } from "react";

type Tone = "warm" | "cold" | "neon";

type LampGlowProps = {
  x: number;
  y: number;
  size?: number;
  ratio?: number;
  tone?: Tone;
  intensity?: number;
  /** 路地など — anchor 未指定時の周期 (例 "6s") */
  speed?: string;
  zClass?: string;
  /** カウンター店内 — 呼吸タイミングを anchor で決める */
  anchor?: CounterLampGlowAnchor;
  /** 路地ホーム等 — 呼吸プロファイル（周期・波形） */
  breatheProfile?: LampBreatheProfile;
  /** @deprecated breatheProfile を使う */
  breatheTiming?: LampBreatheTiming;
  /** "r, g, b" — tone 既定色の上書き */
  colorRgb?: string;
};

export function LampGlow({
  x,
  y,
  size = 30,
  ratio = 1,
  tone = "warm",
  intensity = 0.5,
  speed = "6s",
  zClass = "z-[16]",
  anchor,
  breatheProfile,
  breatheTiming,
  colorRgb,
}: LampGlowProps) {
  const rgb = resolveLampGlowRgb(tone, colorRgb);
  const profile: LampBreatheProfile | undefined =
    breatheProfile ??
    (breatheTiming != null
      ? { ...breatheTiming, variant: "lantern" }
      : anchor != null
        ? getCounterLampBreatheProfile(anchor)
        : undefined);
  const useBreathe = profile != null;

  const glowStyle: CSSProperties = {
    ...lampGlowCenteredLayoutStyle(x, y, size, ratio),
    background: buildLampGlowBackground(rgb, intensity),
    mixBlendMode: "screen",
    filter: "blur(10px)",
    ...(useBreathe
      ? getLampBreatheStyleFromProfile(profile, intensity)
      : {
          opacity: lampGlowElementOpacity(intensity),
          ["--lamp-speed" as string]: speed,
        }),
  };

  const breatheClass = profile
    ? getLampBreatheClassName(profile.variant)
    : "lamp-breathe";

  return (
    <div
      className={`pointer-events-none absolute rounded-full ${useBreathe ? breatheClass : "lamp-pulse"} ${zClass}`}
      style={glowStyle}
      aria-hidden
    />
  );
}

type HazeProps = {
  y?: number;
  intensity?: number;
  zClass?: string;
};

export function Haze({ y = 36, intensity = 0.5, zClass = "z-[15]" }: HazeProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 h-[30%] ${zClass}`}
      aria-hidden
      style={{ top: `${y}%` }}
    >
      <div
        className="fog-drift absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 75% 100% at 50% 50%, rgba(150,160,175,${
            0.14 * intensity
          }), transparent 72%)`,
          filter: "blur(20px)",
        }}
      />
    </div>
  );
}
