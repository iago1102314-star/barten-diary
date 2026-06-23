"use client";

import { lampGlowCenterPinStyle } from "@/lib/entrance/lamp-glow-position";
import { getLoadingGateOrderedLights } from "@/lib/entrance/loading-gate-light-sequence";

/** ローディング点灯順の確認 — 各光の位置に赤い番号 */
export function LoadingGateLightOrderMarkers() {
  const lights = getLoadingGateOrderedLights();

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {lights.map((light) => (
        <div
          key={light.id}
          className="absolute"
          style={lampGlowCenterPinStyle(light.offsetX, light.offsetY)}
        >
          <div
            className="flex h-3 min-w-3 items-center justify-center rounded-full bg-red-500 px-0.5 text-[7px] font-bold leading-none text-white shadow-[0_0_0_1px_#fff,0_0_4px_1px_rgba(255,0,0,0.85)]"
            aria-hidden
          >
            {light.order}
          </div>
          <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap font-mono text-[7px] font-bold leading-none text-red-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
            {light.label}
          </span>
        </div>
      ))}
    </div>
  );
}
