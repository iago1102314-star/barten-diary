"use client";

import type { RecordSceneDrinkTuning } from "@/lib/entrance/record-counter-scene-tuning";
import Image from "next/image";

type DrinkOnRecordCounterProps = {
  src: string;
  placement: RecordSceneDrinkTuning;
};

/** カウンター layer 内 — 定位置・定常表示（スライドなし） */
export function DrinkOnRecordCounter({
  src,
  placement,
}: DrinkOnRecordCounterProps) {
  const { zoom, opacity, aspectRatio, xPercent, yPercent, sizePercent, maxWidthPx } =
    placement;

  return (
    <div
      className="pointer-events-none absolute z-[2]"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: `${sizePercent}%`,
        maxWidth: maxWidthPx,
        opacity,
        transform: `translate(-50%, -50%) scale(${zoom})`,
      }}
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
    </div>
  );
}
