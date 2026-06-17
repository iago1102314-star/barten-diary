"use client";

import {
  COUNTER_CAMERA,
  getLayerTransform,
  type CameraPose,
  type CounterLayerId,
} from "@/lib/entrance/counter-camera-poses";
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

  return (
    <motion.div
      className={className}
      initial={{ y, scale }}
      animate={{ y, scale }}
      transition={{
        duration: COUNTER_CAMERA.transitionSec,
        ease: "linear",
      }}
      style={{ transformOrigin: COUNTER_CAMERA.origin }}
    >
      {children}
    </motion.div>
  );
}
