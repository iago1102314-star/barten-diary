"use client";

import {
  hexToRgba,
  MOOD_VIGNETTE_TUNING,
} from "@/lib/entrance/mood-vignette-tuning";
import { MOOD_SELECT_EXIT_TUNING } from "@/lib/entrance/mood-select-exit-tuning";
import { motion } from "motion/react";

type MoodVignetteOverlayProps = {
  durationScale?: number;
  /** true = 入場アニメ省略（最終状態で即表示） */
  instant?: boolean;
  /** true = 上下から中央へ覆い尽くす退場 */
  exiting?: boolean;
};

/** 気分選択 — 上下ビネット（黒レイヤー）。過去ボトル選択中も維持 */
export function MoodVignetteOverlay({
  durationScale = 1,
  instant = false,
  exiting = false,
}: MoodVignetteOverlayProps) {
  const { top, bottom, bottomLayers, layerZIndex } = MOOD_VIGNETTE_TUNING;
  const t = (sec: number) => sec * durationScale;
  const topTotalPx = top.fixedPx + top.gradPx;
  const topSolid = hexToRgba(top.color, top.opacity);
  const bottomSolid = hexToRgba(bottom.color, bottom.opacity);

  const topBg = `linear-gradient(to bottom, ${topSolid} 0px, ${topSolid} ${top.fixedPx}px, transparent 100%)`;
  const bottomBg = `linear-gradient(to top, ${bottomSolid} 0px, ${bottomSolid} ${bottom.fixedPx}px, transparent 100%)`;

  const enterTransition = (delaySec: number, durationSec: number) =>
    instant
      ? { duration: 0 }
      : {
          delay: t(delaySec),
          duration: t(durationSec),
          ease: "easeOut" as const,
        };

  const exitTransition = {
    duration: t(MOOD_SELECT_EXIT_TUNING.vignetteCloseDurationSec),
    ease: "easeInOut" as const,
  };

  const closeScaleY = MOOD_SELECT_EXIT_TUNING.vignetteCloseScaleY;

  const bandVariants = {
    open: { opacity: 1, y: 0, scaleY: 1 },
    closed: { opacity: 1, y: 0, scaleY: closeScaleY },
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute inset-x-0 top-0"
        style={{
          zIndex: layerZIndex,
          height: topTotalPx,
          background: topBg,
          transformOrigin: "top center",
        }}
        initial={
          instant && !exiting
            ? false
            : exiting
              ? "open"
              : { opacity: 0, y: top.enterY, scaleY: 1 }
        }
        animate={exiting ? "closed" : "open"}
        variants={bandVariants}
        transition={exiting ? exitTransition : enterTransition(top.delaySec, top.durationSec)}
      />
      {bottomLayers.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute inset-x-0 bottom-0"
          style={{
            zIndex: layerZIndex,
            height: `${bottom.fixedPx + bottom.gradPx * layer.gradScale}px`,
            background: bottomBg,
            transformOrigin: "bottom center",
          }}
          initial={
            instant && !exiting
              ? false
              : exiting
                ? "open"
                : { opacity: 0, y: layer.enterY, scaleY: 1 }
          }
          animate={exiting ? "closed" : "open"}
          variants={bandVariants}
          transition={
            exiting
              ? exitTransition
              : enterTransition(layer.delaySec, layer.durationSec)
          }
        />
      ))}
    </div>
  );
}
