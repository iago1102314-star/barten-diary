"use client";

import {
  COUNTER_CAMERA,
  getLayerTransform,
  type CameraPose,
  type CounterLayerId,
} from "@/lib/entrance/counter-camera-poses";
import { MOOD_SELECT_ENTRANCE_DURATION_SCALE } from "@/lib/entrance/mood-select-entrance-tuning";
import { isPerfMotionEnabled } from "@/lib/layout/perf-feature-flags";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type ParallaxLayerProps = {
  layer: CounterLayerId;
  pose: CameraPose;
  children: ReactNode;
  className?: string;
};

/** 奥行きに応じた y / scale — カウンター各レイヤー用 */
export function ParallaxLayer({
  layer,
  pose,
  children,
  className = "",
}: ParallaxLayerProps) {
  const { y, scale } = getLayerTransform(layer, pose);

  if (!isPerfMotionEnabled()) {
    return (
      <div
        className={className}
        style={{
          transform: `translateY(${y}px) scale(${scale})`,
          transformOrigin: COUNTER_CAMERA.origin,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ y, scale }}
      animate={{ y, scale }}
      transition={{
        duration:
          COUNTER_CAMERA.transitionSec * MOOD_SELECT_ENTRANCE_DURATION_SCALE,
        ease: "linear",
      }}
      style={{ transformOrigin: COUNTER_CAMERA.origin }}
    >
      {children}
    </motion.div>
  );
}
