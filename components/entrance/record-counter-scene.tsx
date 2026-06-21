"use client";

import { DrinkOnRecordCounter } from "@/components/entrance/drink-on-record-counter";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { getRecordDrinkImagePath } from "@/lib/entrance/record-drink-image";
import {
  getRecordDrinkPlacement,
  RECORD_COUNTER_SCENE_TUNING,
  recordSceneImageTransformStyle,
  resolveRecordDrinkPlacementKey,
  type RecordDrinkPlacementKey,
  type RecordSceneImageTuning,
} from "@/lib/entrance/record-counter-scene-tuning";
import type { DrinkId } from "@/lib/drinks/drink-catalog";
import Image from "next/image";
import type { ReactNode } from "react";

type RecordCounterSceneProps = {
  drinkId?: DrinkId | null;
  /** 配置キーを直接指定（lab 用） */
  placementKey?: RecordDrinkPlacementKey;
};

function RecordSceneLayerShell({
  zIndex,
  children,
}: {
  zIndex?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function RecordSceneLayerImage({
  src,
  tuning,
  priority = false,
}: {
  src: string;
  tuning: RecordSceneImageTuning;
  priority?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={recordSceneImageTransformStyle(tuning)}
      >
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="pointer-events-none select-none object-cover object-center"
          draggable={false}
          unoptimized
        />
      </div>
    </div>
  );
}

/**
 * grass 明転後 — back-record →（将来マスター）→ counter-record → グラス（子）
 */
export function RecordCounterScene({
  drinkId,
  placementKey,
}: RecordCounterSceneProps) {
  const key = placementKey ?? resolveRecordDrinkPlacementKey(drinkId);
  const drinkPlacement = getRecordDrinkPlacement(key);
  const drinkSrc = getRecordDrinkImagePath();

  return (
    <div className="absolute inset-0">
      <RecordSceneLayerShell zIndex={0}>
        <RecordSceneLayerImage
          src={ENTRANCE_ASSETS.backRecord}
          tuning={RECORD_COUNTER_SCENE_TUNING.back}
          priority
        />
      </RecordSceneLayerShell>

      {/* 将来: マスターレイヤー（z-[1]） */}

      <RecordSceneLayerShell zIndex={2}>
        <RecordSceneLayerImage
          src={ENTRANCE_ASSETS.counterRecord}
          tuning={RECORD_COUNTER_SCENE_TUNING.counter}
          priority
        />
        <DrinkOnRecordCounter src={drinkSrc} placement={drinkPlacement} />
      </RecordSceneLayerShell>
    </div>
  );
}
