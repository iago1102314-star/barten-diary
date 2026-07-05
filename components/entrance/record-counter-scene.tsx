"use client";

import { CounterBackDarkenOverlay } from "@/components/entrance/counter-back-darken-overlay";
import { RecordDrinkNoteScrim } from "@/components/entrance/record-drink-note-scrim";
import { DrinkOnRecordCounter } from "@/components/entrance/drink-on-record-counter";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { getRecordDrinkImagePath } from "@/lib/entrance/record-drink-image";
import {
  getRecordDrinkPlacement,
  RECORD_COUNTER_SCENE_TUNING,
  RECORD_COUNTER_SHOW_DRINK,
  recordSceneImagePanStyle,
  recordSceneImageZoomFrameStyle,
  resolveRecordDrinkPlacementKey,
  type RecordDrinkPlacementKey,
  type RecordSceneImageTuning,
} from "@/lib/entrance/record-counter-scene-tuning";
import type { DrinkId } from "@/lib/drinks/drink-catalog";
import Image from "next/image";
import type { ReactNode } from "react";
import { perfRenderCount } from "@/lib/entrance/perf-debug";

type RecordCounterSceneProps = {
  drinkId?: DrinkId | null;
  /** 配置キーを直接指定（lab 用） */
  placementKey?: RecordDrinkPlacementKey;
  /** メニュー背景用 — グラスのみ省略 */
  backgroundOnly?: boolean;
  /** グラス表示（明転開始時から定位置） */
  showDrink?: boolean;
  /** 下部グラデ（note 表示中だけでなく録音〜暗転まで維持） */
  showNoteScrim?: boolean;
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
  darken = false,
}: {
  src: string;
  tuning: RecordSceneImageTuning;
  priority?: boolean;
  darken?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={recordSceneImagePanStyle(tuning)}>
        <div style={recordSceneImageZoomFrameStyle(tuning.zoom)}>
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
      {darken ? <CounterBackDarkenOverlay /> : null}
    </div>
  );
}

/**
 * grass 明転後 — back-record →（将来マスター）→ counter-record → グラス（子）
 */
export function RecordCounterScene({
  drinkId,
  placementKey,
  backgroundOnly = false,
  showDrink = true,
  showNoteScrim = false,
}: RecordCounterSceneProps) {
  perfRenderCount("RecordCounterScene");
  const key = placementKey ?? resolveRecordDrinkPlacementKey(drinkId);
  const drinkPlacement = getRecordDrinkPlacement(key);
  const drinkSrc = getRecordDrinkImagePath(drinkId);

  return (
    <div className="absolute inset-0">
      <RecordSceneLayerShell zIndex={0}>
        <RecordSceneLayerImage
          src={ENTRANCE_ASSETS.backRecord}
          tuning={RECORD_COUNTER_SCENE_TUNING.back}
          priority
          darken
        />
      </RecordSceneLayerShell>

      {/* 将来: マスターレイヤー（z-[1]） */}

      <RecordSceneLayerShell zIndex={2}>
        <RecordSceneLayerImage
          src={ENTRANCE_ASSETS.counterRecord}
          tuning={RECORD_COUNTER_SCENE_TUNING.counter}
          priority
        />
        {!backgroundOnly && RECORD_COUNTER_SHOW_DRINK && showDrink ? (
          <DrinkOnRecordCounter src={drinkSrc} placement={drinkPlacement} />
        ) : null}
      </RecordSceneLayerShell>

      {showNoteScrim ? <RecordDrinkNoteScrim /> : null}
    </div>
  );
}
