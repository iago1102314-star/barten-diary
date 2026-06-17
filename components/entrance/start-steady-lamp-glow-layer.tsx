"use client";

import { resolveLampGlowRgb } from "@/lib/entrance/lamp-glow-color";
import {
  getLampBreatheClassName,
  getLampBreatheStyleFromProfile,
} from "@/lib/entrance/lamp-glow-breathe";
import { lampGlowCenteredLayoutStyle } from "@/lib/entrance/lamp-glow-position";
import { buildLampGlowBackground } from "@/lib/entrance/lamp-glow-visual";
import { getStartLampBreatheProfile } from "@/lib/entrance/start-lamp-glow-breathe";
import {
  START_LAMP_GLOWS,
  type StartLampGlowConfig,
} from "@/lib/entrance/start-lamp-glows";

/** 雨の路地 — 定常7灯（Ken Burns 内に置く） */
export function StartSteadyLampGlowLayer({
  glows = START_LAMP_GLOWS,
}: {
  glows?: StartLampGlowConfig[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {glows.map((glow) => {
        const rgb = resolveLampGlowRgb(glow.tone, glow.colorRgb);
        const intensity = Math.min(3, glow.intensity);
        const breatheProfile = getStartLampBreatheProfile(glow.anchor);

        return (
          <div
            key={glow.id}
            className={`pointer-events-none absolute rounded-full ${getLampBreatheClassName(breatheProfile.variant)}`}
            style={{
              ...lampGlowCenteredLayoutStyle(
                glow.offsetX,
                glow.offsetY,
                glow.size,
                glow.ratio,
              ),
              background: buildLampGlowBackground(rgb, intensity),
              mixBlendMode: "screen",
              ...getLampBreatheStyleFromProfile(breatheProfile, intensity),
            }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
