"use client";

import { LampGlow } from "@/components/entrance/atmosphere";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion, type MotionProps } from "motion/react";
import Image from "next/image";

type AfterNightBackdropProps = {
  motionProps?: Pick<MotionProps, "initial" | "animate" | "transition">;
};

/** 夜を終えた帰り道 — NightAlley / メモ閲覧共通 */
export function AfterNightBackdrop({ motionProps }: AfterNightBackdropProps) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={motionProps?.initial ?? { opacity: 0, scale: 1.06 }}
      animate={motionProps?.animate ?? { opacity: 1, scale: 1.02 }}
      transition={
        motionProps?.transition ?? {
          opacity: { duration: 3, ease: EASE_DRIFT },
          scale: { duration: 30, ease: EASE_DRIFT },
        }
      }
    >
      <Image
        src={ENTRANCE_ASSETS.afterNight}
        alt=""
        fill
        priority
        sizes="420px"
        className="object-cover"
        draggable={false}
        unoptimized
      />

      <LampGlow x={58} y={29} tone="cold" size={11} intensity={0.26} speed="9s" />
      <LampGlow x={54} y={40} tone="cold" size={7} intensity={0.18} speed="12s" />
      <LampGlow x={11} y={18} tone="warm" size={8} intensity={0.2} speed="11s" />

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
    </motion.div>
  );
}
