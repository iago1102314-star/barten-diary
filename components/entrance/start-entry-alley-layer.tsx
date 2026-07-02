"use client";

import { Haze } from "@/components/entrance/atmosphere";
import { isPerfHazeEnabled } from "@/lib/layout/perf-feature-flags";
import { GlowAnchorMarker } from "@/components/entrance/glow-anchor-marker";
import { LoadingGateLightOrderMarkers } from "@/components/entrance/loading-gate-light-order-markers";
import { resolveLampGlowRgb } from "@/lib/entrance/lamp-glow-color";
import {
  getLampBreatheClassName,
  getLampBreatheStyleFromProfile,
} from "@/lib/entrance/lamp-glow-breathe";
import {
  interpolateStartGlowVisual,
  pairStartGlowsById,
} from "@/lib/entrance/lamp-glow-interpolate";
import { lampGlowCenteredLayoutStyle } from "@/lib/entrance/lamp-glow-position";
import {
  buildBokehGlowBackground,
  bokehOrbElementOpacity,
  buildLampGlowBackground,
  lampGlowElementOpacity,
} from "@/lib/entrance/lamp-glow-visual";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import {
  StartEntryAtmosphereGrade,
  StartEntryBarWarmGrade,
} from "@/components/entrance/start-entry-atmosphere-grade";
import { START_ENTRY_ATMOSPHERE_GRADE } from "@/lib/entrance/start-entry-atmosphere-grade";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { getStartLampBreatheProfile } from "@/lib/entrance/start-lamp-glow-breathe";
import {
  SHOW_START_BOKEH_ONLY_POSITION_MARKERS,
  START_BOKEH_LAMP_GLOWS,
  START_BOKEH_ONLY_LAMP_GLOWS,
  type StartBokehLampGlowConfig,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import {
  SHOW_START_LAMP_GLOW_DEBUG_MARKERS,
  SHOW_START_LAMP_GLOW_LIGHT,
  START_LAMP_GLOWS,
  type StartLampGlowConfig,
} from "@/lib/entrance/start-lamp-glows";
import { motion } from "motion/react";
import Image from "next/image";
import { useMemo, type ReactNode } from "react";

function GroupLightEnvelope({
  appear,
  offsetX,
  offsetY,
  size,
  ratio,
  bloomBleed = false,
  children,
}: {
  appear: number;
  offsetX: number;
  offsetY: number;
  size: number;
  ratio: number;
  bloomBleed?: boolean;
  children: ReactNode;
}) {
  if (appear <= 0.0005) return null;

  // 立ち上がり序盤だけ軽く滲ませ、全体ブラーで段が潰れないようにする
  const bloomT = bloomBleed ? Math.max(0, 1 - appear / 0.38) : 0;
  const bleedBlurPx = bloomT * 5;

  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        ...lampGlowCenteredLayoutStyle(offsetX, offsetY, size, ratio),
        opacity: appear,
        filter: bleedBlurPx > 0.5 ? `blur(${bleedBlurPx}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function BokehOnlyOrb({
  glow,
  fade = 1,
  appear = 1,
  fillParent = false,
}: {
  glow: StartBokehLampGlowConfig;
  fade?: number;
  appear?: number;
  fillParent?: boolean;
}) {
  const rgb = resolveLampGlowRgb(glow.tone, glow.colorRgb);
  const clampedFade = Math.max(0, Math.min(1, fade * appear));
  const intensity = Math.min(3, glow.intensity * (fillParent ? fade : clampedFade));
  if (!fillParent && clampedFade <= 0.001) return null;

  const layoutStyle = fillParent
    ? { position: "absolute" as const, inset: 0 }
    : lampGlowCenteredLayoutStyle(
        glow.offsetX,
        glow.offsetY,
        glow.size,
        glow.ratio,
      );

  const orbOpacity = fillParent
    ? bokehOrbElementOpacity(intensity) * fade
    : bokehOrbElementOpacity(intensity) * clampedFade;

  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        ...layoutStyle,
        background: buildBokehGlowBackground(rgb, intensity),
        opacity: orbOpacity,
        mixBlendMode: "screen",
        filter: "blur(2px)",
      }}
      aria-hidden
    />
  );
}

export function PairedStartEntranceGlow({
  bokeh,
  steady,
  progress,
  enableBreathe = false,
  appear = 1,
  fillParent = false,
}: {
  bokeh: StartBokehLampGlowConfig;
  steady: StartLampGlowConfig;
  progress: number;
  enableBreathe?: boolean;
  appear?: number;
  fillParent?: boolean;
}) {
  const clampedAppear = Math.max(0, Math.min(1, appear));
  if (!fillParent && clampedAppear <= 0.001) return null;

  const visual = interpolateStartGlowVisual(bokeh, steady, progress);
  const intensity = Math.min(
    3,
    visual.intensity * (fillParent ? 1 : clampedAppear),
  );
  const layoutStyle = fillParent
    ? { position: "absolute" as const, inset: 0 }
    : lampGlowCenteredLayoutStyle(
        visual.offsetX,
        visual.offsetY,
        visual.size,
        visual.ratio,
      );
  const blurFilter =
    visual.blurPx > 0 ? `blur(${visual.blurPx}px)` : undefined;
  const breatheProfile = enableBreathe
    ? getStartLampBreatheProfile(steady.anchor)
    : undefined;

  if (breatheProfile) {
    return (
      <div
        className={`pointer-events-none absolute rounded-full ${getLampBreatheClassName(breatheProfile.variant)}`}
        style={{
          ...layoutStyle,
          background: buildLampGlowBackground(visual.rgb, intensity),
          mixBlendMode: "screen",
          filter: blurFilter,
          ...getLampBreatheStyleFromProfile(breatheProfile, intensity),
        }}
        aria-hidden
      />
    );
  }

  const bokehWeight = 1 - visual.steadyWeight;
  const lampWeight = visual.steadyWeight;

  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        ...layoutStyle,
        filter: blurFilter,
      }}
      aria-hidden
    >
      {bokehWeight > 0.001 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: buildBokehGlowBackground(visual.rgb, intensity),
            opacity: bokehWeight * bokehOrbElementOpacity(intensity),
            mixBlendMode: "screen",
          }}
        />
      )}
      {lampWeight > 0.001 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: buildLampGlowBackground(visual.rgb, intensity),
            opacity: lampWeight * lampGlowElementOpacity(intensity),
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}

export const START_ENTRY_ALLEY_KEN_BURNS = {
  initial: { scale: 1.12, x: -10 },
  animate: { scale: 1, x: 0 },
  transition: {
    scale: { duration: 16, ease: "easeOut" as const },
    x: { duration: 16, ease: "easeOut" as const },
  },
} as const;

type StartEntryAlleyLayerProps = {
  backgroundOpacity: number;
  entranceProgress: number;
  bokehOnlyFade?: number;
  getLightAppear?: (lightId: string) => number;
  steadyLampGlows?: StartLampGlowConfig[];
  bokehLampGlows?: StartBokehLampGlowConfig[];
  bokehOnlyLampGlows?: StartBokehLampGlowConfig[];
  kenBurnsMotion?: {
    initial?: false | { scale: number; x: number };
    animate: { scale: number; x: number };
    transition?: typeof START_ENTRY_ALLEY_KEN_BURNS.transition;
  };
  showBokehOnlyOrbs?: boolean;
  imageScale?: number;
  imageObjectPosition?: string;
  imageTransformOrigin?: string;
  imageScaleTransition?: { duration: number; ease?: typeof EASE_DRIFT };
  /** 点灯順の確認用赤番号 */
  showOrderMarkers?: boolean;
  showBackground?: boolean;
  showLights?: boolean;
  showAtmosphere?: boolean;
  /** ローディング用 — グループ内の灯りを同一 opacity で同時に点灯 */
  syncGroupLightAppear?: boolean;
};

export function StartEntryAlleyLayer({
  backgroundOpacity,
  entranceProgress,
  bokehOnlyFade = 1,
  getLightAppear,
  steadyLampGlows = START_LAMP_GLOWS,
  bokehLampGlows = START_BOKEH_LAMP_GLOWS,
  bokehOnlyLampGlows = START_BOKEH_ONLY_LAMP_GLOWS,
  kenBurnsMotion = START_ENTRY_ALLEY_KEN_BURNS,
  showBokehOnlyOrbs = true,
  imageScale = 1,
  imageObjectPosition = "60% 50%",
  imageTransformOrigin,
  imageScaleTransition,
  showOrderMarkers = false,
  showBackground = true,
  showLights = true,
  showAtmosphere = true,
  syncGroupLightAppear = false,
}: StartEntryAlleyLayerProps) {
  const showMarkers = SHOW_START_LAMP_GLOW_DEBUG_MARKERS;
  const showBokehOnlyMarkers = SHOW_START_BOKEH_ONLY_POSITION_MARKERS;
  const showGlow = SHOW_START_LAMP_GLOW_LIGHT || showMarkers;
  const showAnchoredGlows = showGlow && SHOW_START_LAMP_GLOW_LIGHT;
  const useGroupEnvelope = syncGroupLightAppear && getLightAppear != null;
  const resolveAppear = (lightId: string) => getLightAppear?.(lightId) ?? 1;

  const glowPairs = useMemo(
    () => pairStartGlowsById(bokehLampGlows, steadyLampGlows),
    [bokehLampGlows, steadyLampGlows],
  );
  const grade = START_ENTRY_ATMOSPHERE_GRADE;

  return (
    <motion.div className="absolute inset-0" {...kenBurnsMotion}>
      {showBackground && (
        <div className="absolute inset-0" style={{ opacity: backgroundOpacity }}>
          <motion.div
            className="absolute inset-0"
            animate={{ scale: imageScale }}
            transition={imageScaleTransition ?? { duration: 0 }}
            style={
              imageTransformOrigin
                ? { transformOrigin: imageTransformOrigin }
                : undefined
            }
          >
            <Image
              src={ENTRANCE_ASSETS.start}
              alt=""
              fill
              priority
              loading="eager"
              sizes="440px"
              className="object-cover"
              style={{ objectPosition: imageObjectPosition }}
              draggable={false}
              unoptimized
            />
          </motion.div>
        </div>
      )}

      {showAtmosphere && (
        <StartEntryAtmosphereGrade steadyLampGlows={steadyLampGlows} />
      )}

      {showLights && (showAnchoredGlows || showBokehOnlyMarkers) && (
        <div className="pointer-events-none absolute inset-0 z-[1]">
          {showMarkers &&
            entranceProgress >= 1 &&
            steadyLampGlows.map((glow) => (
              <GlowAnchorMarker key={`marker-${glow.id}`} glow={glow} />
            ))}
          {showBokehOnlyMarkers &&
            bokehOnlyLampGlows.map((glow) => (
              <GlowAnchorMarker
                key={`marker-${glow.id}`}
                glow={glow}
                compact
              />
            ))}
          {showAnchoredGlows &&
            glowPairs.map(({ bokeh, steady }) => {
              const appear = resolveAppear(bokeh.id);
              const visual = interpolateStartGlowVisual(
                bokeh,
                steady,
                entranceProgress,
              );
              const glow = (
                <PairedStartEntranceGlow
                  bokeh={bokeh}
                  steady={steady}
                  progress={entranceProgress}
                  enableBreathe={entranceProgress >= 1}
                  appear={useGroupEnvelope ? 1 : appear}
                  fillParent={useGroupEnvelope}
                />
              );

              if (!useGroupEnvelope) {
                return (
                  <PairedStartEntranceGlow
                    key={`paired-${bokeh.id}`}
                    bokeh={bokeh}
                    steady={steady}
                    progress={entranceProgress}
                    enableBreathe={entranceProgress >= 1}
                    appear={appear}
                  />
                );
              }

              return (
                <GroupLightEnvelope
                  key={`paired-${bokeh.id}`}
                  appear={appear}
                  offsetX={visual.offsetX}
                  offsetY={visual.offsetY}
                  size={visual.size}
                  ratio={visual.ratio}
                  bloomBleed={useGroupEnvelope}
                >
                  {glow}
                </GroupLightEnvelope>
              );
            })}
          {showAnchoredGlows &&
            showBokehOnlyOrbs &&
            entranceProgress < 1 &&
            bokehOnlyLampGlows.map((glow) => {
              const appear = resolveAppear(glow.id);
              const orb = (
                <BokehOnlyOrb
                  glow={glow}
                  fade={bokehOnlyFade}
                  appear={useGroupEnvelope ? 1 : appear}
                  fillParent={useGroupEnvelope}
                />
              );

              if (!useGroupEnvelope) {
                return (
                  <BokehOnlyOrb
                    key={`bokeh-only-${glow.id}`}
                    glow={glow}
                    fade={bokehOnlyFade}
                    appear={appear}
                  />
                );
              }

              return (
                <GroupLightEnvelope
                  key={`bokeh-only-${glow.id}`}
                  appear={appear}
                  offsetX={glow.offsetX}
                  offsetY={glow.offsetY}
                  size={glow.size}
                  ratio={glow.ratio}
                  bloomBleed={useGroupEnvelope}
                >
                  {orb}
                </GroupLightEnvelope>
              );
            })}
        </div>
      )}

      {showAtmosphere ? (
        <>
          {isPerfHazeEnabled() ? <Haze y={36} intensity={1} /> : null}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(12, 10, 8, ${grade.verticalTopWashOpacity}) 0%, transparent 42%, rgba(12, 10, 8, ${grade.verticalBottomWashOpacity}) 100%)`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{
              backgroundColor: `rgba(${grade.blueWashRgb}, ${grade.blueWashOpacity})`,
            }}
            aria-hidden
          />
          <StartEntryBarWarmGrade />
        </>
      ) : null}
      {showOrderMarkers && <LoadingGateLightOrderMarkers />}
    </motion.div>
  );
}
