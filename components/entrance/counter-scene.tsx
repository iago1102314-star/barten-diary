"use client";

import { DrinkOnCounter } from "@/components/entrance/drink-on-counter";
import { LampGlow } from "@/components/entrance/atmosphere";
import { ParallaxLayer } from "@/components/entrance/parallax-layer";
import { moodAccent } from "@/lib/entrance/mood-accent";
import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
import { EASE_DRIFT, EASE_SOFT } from "@/lib/entrance/motion-presets";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { motion } from "motion/react";
import Image from "next/image";

type CounterSceneProps = {
  drinkImageSrc?: string | null;
  drinkName?: string | null;
  drinkNote?: string | null;
  moodCategoryId?: DrinkCategoryId | null;
  drinkOnCounter?: boolean;
  priority?: boolean;
  settle?: boolean;
  masterMode?: "idle" | "talking";
  /** neutral = マスターと向き合う / pondering = カウンターへ目線を落とす */
  cameraPose?: CameraPose;
  /** 気分選択など UI 重なり時 — ぼかし・無限アニメを止めて GPU 負荷を下げる */
  reduceGpuLoad?: boolean;
};

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

  if (!kenBurns) return img;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 14, ease: EASE_DRIFT }}
    >
      {img}
    </motion.div>
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
  const positionClass =
    side === "left" ? "left-[-4%] top-[-4%]" : "right-[-4%] top-[-4%]";
  const flickerClass = staticLight ? "" : "animate-lantern-flicker";

  return (
    <div
      className={`pointer-events-none absolute ${positionClass} w-[32%] max-w-[134px] origin-top ${flickerClass}`}
    >
      <Image
        src={ENTRANCE_ASSETS.lantern}
        alt=""
        width={320}
        height={640}
        priority={priority}
        className="h-auto w-full"
        draggable={false}
        unoptimized
      />
    </div>
  );
}

/**
 * BarStage 相当 — back(奥) → lights → master → lantern → front(手前)
 * 各レイヤーを ParallaxLayer で包み、ポーズに応じて遠近法どおりに動かす。
 */
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
}: CounterSceneProps) {
  const accent = moodAccent(moodCategoryId ?? null);
  const masterAnim =
    masterMode === "talking" ? "master-breathe" : "master-breathe";

  return (
    <motion.div
      className="absolute inset-0"
      initial={settle ? { scale: 1.05, y: -8 } : false}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 1.8, ease: EASE_SOFT }}
    >
      {moodCategoryId && !reduceGpuLoad && (
        <ParallaxLayer layer="glow" pose={cameraPose} className="absolute inset-0 z-0">
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: `radial-gradient(85% 55% at 50% 28%, ${accent}, transparent 65%)`,
            }}
          />
        </ParallaxLayer>
      )}

      <ParallaxLayer layer="back" pose={cameraPose} className="absolute inset-0 z-0">
        <SceneLayer
          src={ENTRANCE_ASSETS.counterBack}
          alt=""
          priority={priority}
          kenBurns={!reduceGpuLoad}
        />
      </ParallaxLayer>

      {!reduceGpuLoad && (
        <ParallaxLayer layer="glow" pose={cameraPose} className="absolute inset-0 z-0">
          <LampGlow
            x={13}
            y={38}
            tone="warm"
            size={22}
            intensity={0.45}
            speed="5.5s"
            zClass="z-0"
          />
          <LampGlow
            x={62}
            y={24}
            tone="warm"
            size={88}
            ratio={0.32}
            intensity={0.18}
            speed="8s"
            zClass="z-0"
          />
          <LampGlow
            x={62}
            y={43}
            tone="warm"
            size={88}
            ratio={0.32}
            intensity={0.2}
            speed="9.5s"
            zClass="z-0"
          />
        </ParallaxLayer>
      )}

      <ParallaxLayer
        layer="master"
        pose={cameraPose}
        className={`absolute inset-0 z-[1] ${masterAnim}`}
      >
        <SceneLayer src={ENTRANCE_ASSETS.masterIdle} alt="" priority={priority} />
      </ParallaxLayer>

      <ParallaxLayer layer="lantern" pose={cameraPose} className="absolute inset-0 z-[2]">
        <HangingLantern side="left" priority={priority} staticLight={reduceGpuLoad} />
        <HangingLantern side="right" priority={priority} staticLight={reduceGpuLoad} />
      </ParallaxLayer>

      <ParallaxLayer layer="front" pose={cameraPose} className="absolute inset-0 z-[3]">
        <SceneLayer src={ENTRANCE_ASSETS.counterFront} alt="" priority={priority} />
      </ParallaxLayer>

      {drinkImageSrc && drinkOnCounter && (
        <ParallaxLayer layer="drink" pose={cameraPose} className="absolute inset-0 z-[4]">
          <DrinkOnCounter
            src={drinkImageSrc}
            drinkName={drinkName ?? undefined}
            drinkNote={drinkNote}
          />
        </ParallaxLayer>
      )}

      {drinkImageSrc && !drinkOnCounter && (
        <ParallaxLayer layer="drink" pose={cameraPose} className="absolute inset-0 z-[4]">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE_SOFT }}
          >
            <SceneLayer src={drinkImageSrc} alt="" />
          </motion.div>
        </ParallaxLayer>
      )}
    </motion.div>
  );
}
