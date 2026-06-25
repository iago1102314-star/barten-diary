"use client";

import {
  buildBarWarmBackground,
  buildDoorLiftBackground,
  buildLanternReachLiftBackground,
  START_ENTRY_ATMOSPHERE_GRADE,
} from "@/lib/entrance/start-entry-atmosphere-grade";
import type { StartLampGlowConfig } from "@/lib/entrance/start-lamp-glows";
import { useMemo } from "react";

type StartEntryAtmosphereGradeProps = {
  steadyLampGlows: StartLampGlowConfig[];
};

const G = START_ENTRY_ATMOSPHERE_GRADE;

/**
 * ホーム路地 — 写真露出の局部補正（ランタン・扉）
 * 光源レイヤーは触らず、その手前の CSS のみ。
 */
export function StartEntryAtmosphereGrade({
  steadyLampGlows,
}: StartEntryAtmosphereGradeProps) {
  const lanternReachBackground = useMemo(
    () => buildLanternReachLiftBackground(steadyLampGlows),
    [steadyLampGlows],
  );

  return (
    <>
      {/* ① ランタン光の届き — 画像の上・光源の下 */}
      <div
        className="pointer-events-none absolute inset-0 z-[0.5]"
        aria-hidden
        style={{
          background: lanternReachBackground,
          backgroundRepeat: "no-repeat",
          mixBlendMode: "soft-light",
          opacity: G.lanternReach.layerOpacity,
        }}
      />

      {/* ② 扉 — 入口の黒潰れを戻す */}
      <div
        className="pointer-events-none absolute inset-0 z-[0.5]"
        aria-hidden
        style={{
          background: buildDoorLiftBackground(),
          backgroundRepeat: "no-repeat",
          mixBlendMode: G.doorLift.blendMode,
          opacity: G.doorLift.layerOpacity,
        }}
      />
    </>
  );
}

/** ③ 大気スタックの後 — 右バー周辺の暖色補正 */
export function StartEntryBarWarmGrade() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2]"
      aria-hidden
      style={{
        background: buildBarWarmBackground(),
        backgroundRepeat: "no-repeat",
        mixBlendMode: G.barWarm.blendMode,
        opacity: G.barWarm.layerOpacity,
      }}
    />
  );
}
