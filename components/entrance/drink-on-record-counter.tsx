"use client";

import type { RecordSceneDrinkTuning } from "@/lib/entrance/record-counter-scene-tuning";
import { EASE_SOFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
import Image from "next/image";

type DrinkOnRecordCounterProps = {
  src: string;
  placement: RecordSceneDrinkTuning;
};

/** カウンター layer 内 — x/y % で配置（画面基準ではない） */
export function DrinkOnRecordCounter({
  src,
  placement,
}: DrinkOnRecordCounterProps) {
  const { zoom, opacity, aspectRatio, xPercent, yPercent, sizePercent, maxWidthPx } =
    placement;

  return (
    <motion.div
      key={`drink-${xPercent}-${yPercent}-${zoom}-${opacity}`}
      className="pointer-events-none absolute z-[2]"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: `${sizePercent}%`,
        maxWidth: maxWidthPx,
      }}
      initial={{
        opacity: 0,
        x: "-50%",
        y: "-50%",
        scale: zoom * 0.92,
      }}
      animate={{
        opacity,
        x: "-50%",
        y: "-50%",
        scale: zoom,
      }}
      transition={{ duration: 1.1, ease: EASE_SOFT, delay: 0.15 }}
    >
      <div className="relative w-full" style={{ aspectRatio }}>
        <Image
          src={src}
          alt=""
          fill
          sizes={`(max-width: 430px) ${maxWidthPx}px, ${sizePercent}vw`}
          className="pointer-events-none select-none"
          style={{
            objectFit: placement.objectFit,
            objectPosition: placement.objectPosition,
          }}
          draggable={false}
          unoptimized
        />
      </div>
    </motion.div>
  );
}
