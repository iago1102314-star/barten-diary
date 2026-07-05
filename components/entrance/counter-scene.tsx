"use client";

import { CounterBackDarkenOverlay } from "@/components/entrance/counter-back-darken-overlay";
import { DrinkOnCounter } from "@/components/entrance/drink-on-counter";
import {
  GlowAnchorMarker,
  GlowAnchorRoot,
} from "@/components/entrance/glow-anchor-marker";
import { LampGlow } from "@/components/entrance/atmosphere";
import { ParallaxLayer } from "@/components/entrance/parallax-layer";
import { moodAccent } from "@/lib/entrance/mood-accent";
import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
import {
  COUNTER_LAMP_GLOWS,
  mapGlowsByAnchor,
  SHOW_LAMP_GLOW_DEBUG_MARKERS,
  SHOW_LAMP_GLOW_LIGHT,
  type CounterLampGlowConfig,
} from "@/lib/entrance/counter-lamp-glows";
import { EASE_DRIFT, EASE_SOFT } from "@/lib/entrance/motion-presets";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import {
  isPerfLampEnabled,
  isPerfMotionEnabled,
} from "@/lib/layout/perf-feature-flags";
import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";
import { perfRenderCount } from "@/lib/entrance/perf-debug";

type CounterSceneProps = {
  drinkImageSrc?: string | null;
  drinkName?: string | null;
  drinkNote?: string | null;
  moodCategoryId?: DrinkCategoryId | null;
  drinkOnCounter?: boolean;
  priority?: boolean;
  settle?: boolean;
  masterMode?: "idle" | "talking";
  cameraPose?: CameraPose;
  reduceGpuLoad?: boolean;
  /** ラボ / ホーム光調整 — 未指定時は COUNTER_LAMP_GLOWS */
  lampGlows?: CounterLampGlowConfig[];
  /** 光本体の強制表示（未指定時は SHOW_LAMP_GLOW_LIGHT） */
  showLampGlowLight?: boolean;
  /** @experimental マスター画像レイヤーを非表示 */
  hideMaster?: boolean;
  /** メニュー背景用 — ドリンク UI のみ省略 */
  backgroundOnly?: boolean;
};

function KenBurnsWrap({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) {
    return <div className="absolute inset-0">{children}</div>;
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 14, ease: EASE_DRIFT }}
    >
      {children}
    </motion.div>
  );
}

function SceneLayer({
  src,
  alt,
  priority = false,
  kenBurns = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  kenBurns?: boolean;
}) {
  const img = (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="440px"
      className="object-cover"
      draggable={false}
      unoptimized
    />
  );

  if (!kenBurns) {
    return <div className="absolute inset-0">{img}</div>;
  }

  return <KenBurnsWrap enabled>{img}</KenBurnsWrap>;
}

/** counter-back のみ — 画像 + 暗さオーバーレイ（Ken Burns / パララックスと一体） */
function CounterBackLayer({
  priority = false,
  kenBurns = false,
}: {
  priority?: boolean;
  kenBurns?: boolean;
}) {
  const img = (
    <Image
      src={ENTRANCE_ASSETS.counterBack}
      alt=""
      fill
      priority={priority}
      sizes="440px"
      className="object-cover"
      draggable={false}
      unoptimized
    />
  );

  const content = (
    <>
      <div className="absolute inset-0">{img}</div>
      <CounterBackDarkenOverlay />
    </>
  );

  if (!kenBurns) {
    return <div className="absolute inset-0">{content}</div>;
  }

  return <KenBurnsWrap enabled>{content}</KenBurnsWrap>;
}

function AnchoredLampGlow({ glow }: { glow: CounterLampGlowConfig }) {
  return (
    <LampGlow
      anchor={glow.anchor}
      x={glow.offsetX}
      y={glow.offsetY}
      size={glow.size}
      ratio={glow.ratio}
      tone={glow.tone}
      intensity={glow.intensity}
      colorRgb={glow.colorRgb}
      speed={glow.speed}
      zClass="z-[1]"
    />
  );
}

function LanternAnchor({
  side,
  children,
}: {
  side: "left" | "right";
  children: ReactNode;
}) {
  const positionClass =
    side === "left" ? "left-[-4%] top-[-4%]" : "right-[-4%] top-[-4%]";

  return (
    <div
      className={`pointer-events-none absolute ${positionClass} w-[32%] max-w-[134px] origin-top overflow-visible`}
    >
      {children}
    </div>
  );
}

/** ランタン先端 — HangingLantern と同じ枠（320×640）で % 座標を決める */
function LanternGlowAnchor({
  side,
  glow,
  showGlow = false,
  showMarker = false,
}: {
  side: "left" | "right";
  glow?: CounterLampGlowConfig;
  showGlow?: boolean;
  showMarker?: boolean;
}) {
  if (!glow || (!showGlow && !showMarker)) return null;

  return (
    <LanternAnchor side={side}>
      <GlowAnchorRoot className="overflow-visible">
        <div className="block w-full aspect-[320/640]" aria-hidden />
        {showGlow && <AnchoredLampGlow glow={glow} />}
        {showMarker && <GlowAnchorMarker glow={glow} />}
      </GlowAnchorRoot>
    </LanternAnchor>
  );
}

/** 背景ランプ — 背景レイヤーと同じ Ken Burns 枠（画面全体）基準 */
function BackLampGlowAnchor({
  glow,
  showKenBurns,
  showGlow = false,
  showMarker = false,
}: {
  glow?: CounterLampGlowConfig;
  showKenBurns: boolean;
  showGlow?: boolean;
  showMarker?: boolean;
}) {
  if (!glow || (!showGlow && !showMarker)) return null;

  return (
    <KenBurnsWrap enabled={showKenBurns}>
      {/* relative と absolute を混ぜない — inset-0 で画面全体を % 基準にする */}
      <div className="absolute inset-0 overflow-visible">
        {showGlow && <AnchoredLampGlow glow={glow} />}
        {showMarker && <GlowAnchorMarker glow={glow} />}
      </div>
    </KenBurnsWrap>
  );
}

function HangingLantern({
  side,
  priority = false,
  staticLight = false,
}: {
  side: "left" | "right";
  priority?: boolean;
  staticLight?: boolean;
}) {
  const flickerClass = staticLight ? "" : "animate-lantern-flicker";

  return (
    <LanternAnchor side={side}>
      <div className={flickerClass}>
        <Image
          src={ENTRANCE_ASSETS.lantern}
          alt=""
          width={320}
          height={640}
          priority={priority}
          className="block h-auto w-full"
          draggable={false}
          unoptimized
        />
      </div>
    </LanternAnchor>
  );
}

export function CounterScene({
  drinkImageSrc,
  drinkName,
  drinkNote,
  moodCategoryId,
  drinkOnCounter = false,
  priority = false,
  settle = false,
  masterMode = "idle",
  cameraPose = "neutral",
  reduceGpuLoad = false,
  lampGlows,
  showLampGlowLight,
  hideMaster = false,
  backgroundOnly = false,
}: CounterSceneProps) {
  perfRenderCount("CounterScene");
  const accent = moodAccent(moodCategoryId ?? null);
  const lampEffectsOn = isPerfLampEnabled();
  const motionOn = isPerfMotionEnabled();
  const masterAnim = lampEffectsOn ? "master-breathe" : "";
  const glowByAnchor = mapGlowsByAnchor(lampGlows ?? COUNTER_LAMP_GLOWS);
  const showLampGlows = !reduceGpuLoad && lampEffectsOn;
  const showMarkers = showLampGlows && SHOW_LAMP_GLOW_DEBUG_MARKERS;
  const showGlow =
    showLampGlows && (showLampGlowLight ?? SHOW_LAMP_GLOW_LIGHT);
  const showLampOverlay = showMarkers || showGlow;
  const staticLantern = reduceGpuLoad || !lampEffectsOn;
  const enableKenBurns = !reduceGpuLoad && motionOn;

  const sceneBody = (
    <>
      {moodCategoryId && !reduceGpuLoad && (
        <ParallaxLayer layer="glow" pose={cameraPose} className="absolute inset-0 z-0">
          {motionOn ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: `radial-gradient(85% 55% at 50% 28%, ${accent}, transparent 65%)`,
              }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.825]"
              style={{
                background: `radial-gradient(85% 55% at 50% 28%, ${accent}, transparent 65%)`,
              }}
            />
          )}
        </ParallaxLayer>
      )}

      <ParallaxLayer layer="back" pose={cameraPose} className="absolute inset-0 z-0">
        <CounterBackLayer priority={priority} kenBurns={enableKenBurns} />
      </ParallaxLayer>

      <ParallaxLayer
        layer="master"
        pose={cameraPose}
        className="absolute inset-0 z-[1]"
      >
        {!hideMaster && (
          <div className={`absolute inset-0 ${masterAnim}`}>
            <SceneLayer src={ENTRANCE_ASSETS.masterIdle} alt="" priority={priority} />
          </div>
        )}
      </ParallaxLayer>

      <ParallaxLayer layer="lantern" pose={cameraPose} className="absolute inset-0 z-[2]">
        <HangingLantern
          side="left"
          priority={priority}
          staticLight={staticLantern}
        />
        <HangingLantern
          side="right"
          priority={priority}
          staticLight={staticLantern}
        />
      </ParallaxLayer>

      <ParallaxLayer layer="front" pose={cameraPose} className="absolute inset-0 z-[3]">
        <SceneLayer src={ENTRANCE_ASSETS.counterFront} alt="" priority={priority} />
      </ParallaxLayer>

      {showLampOverlay && (
        <>
          <ParallaxLayer
            layer="lantern"
            pose={cameraPose}
            className="pointer-events-none absolute inset-0 z-[8] overflow-visible"
          >
            <LanternGlowAnchor
              side="left"
              glow={glowByAnchor["lantern-left"]}
              showMarker={showMarkers}
              showGlow={showGlow}
            />
            <LanternGlowAnchor
              side="right"
              glow={glowByAnchor["lantern-right"]}
              showMarker={showMarkers}
              showGlow={showGlow}
            />
          </ParallaxLayer>

          {glowByAnchor["back-lamp"] && (
            <ParallaxLayer
              layer="back"
              pose={cameraPose}
              className="pointer-events-none absolute inset-0 z-[8] overflow-visible"
            >
              <BackLampGlowAnchor
                glow={glowByAnchor["back-lamp"]}
                showKenBurns={enableKenBurns}
                showMarker={showMarkers}
                showGlow={showGlow}
              />
            </ParallaxLayer>
          )}
        </>
      )}

      {!backgroundOnly && drinkImageSrc && drinkOnCounter && (
        <ParallaxLayer layer="drink" pose={cameraPose} className="absolute inset-0 z-[6]">
          <DrinkOnCounter
            src={drinkImageSrc}
            drinkName={drinkName ?? undefined}
            drinkNote={drinkNote}
          />
        </ParallaxLayer>
      )}

      {!backgroundOnly && drinkImageSrc && !drinkOnCounter && (
        <ParallaxLayer layer="drink" pose={cameraPose} className="absolute inset-0 z-[6]">
          {motionOn ? (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: EASE_SOFT }}
            >
              <SceneLayer src={drinkImageSrc} alt="" />
            </motion.div>
          ) : (
            <div className="absolute inset-0">
              <SceneLayer src={drinkImageSrc} alt="" />
            </div>
          )}
        </ParallaxLayer>
      )}
    </>
  );

  if (!motionOn) {
    return <div className="absolute inset-0">{sceneBody}</div>;
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={settle ? { scale: 1.05, y: -8 } : false}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 1.8, ease: EASE_SOFT }}
    >
      {sceneBody}
    </motion.div>
  );
}
