"use client";

import type { CSSProperties } from "react";

/* ───────── 光源グロウ ─────────
   円形ボカシの多用を避け、面で滲む光として置く。
   画像内の実際の光源位置に合わせて使うこと。
   zClass で重なり順を制御（マスターより後ろに置く等）。 */

type Tone = "warm" | "cold" | "neon";

type LampGlowProps = {
  /** 光源の中心 (％) */
  x: number;
  y: number;
  /** 横幅 (枠幅に対する％) */
  size?: number;
  /** 縦横比 (1 = 円, <1 で縦長, >1 で横長) */
  ratio?: number;
  tone?: Tone;
  intensity?: number;
  /** 明滅周期 */
  speed?: string;
  /** 重なり順 (例: "z-0" でマスターの後ろ) */
  zClass?: string;
};

const TONE: Record<Tone, string> = {
  warm: "238, 176, 96",
  cold: "176, 206, 226",
  neon: "120, 196, 214",
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
}: LampGlowProps) {
  const rgb = TONE[tone];
  const style: CSSProperties = {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}%`,
    aspectRatio: String(1 / ratio),
    transform: "translate(-50%, -50%)",
    background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${rgb}, ${intensity}) 0%, rgba(${rgb}, ${
      intensity * 0.35
    }) 35%, rgba(${rgb}, ${intensity * 0.08}) 58%, transparent 88%)`,
    mixBlendMode: "screen",
    filter: "blur(10px)",
    ["--lamp-speed" as string]: speed,
  };

  return (
    <div
      className={`lamp-pulse pointer-events-none absolute rounded-full ${zClass}`}
      aria-hidden
      style={style}
    />
  );
}

/* ───────── 遠景の靄 ─────────
   雨の代わりに、奥の空気のゆらぎで「生きた静止画」にする。 */

type HazeProps = {
  /** 靄の帯の縦位置 (％) */
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
