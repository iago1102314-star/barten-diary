import type { MoodOption } from "@/components/entrance/bar-seat-mood-picker";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { preloadImage } from "@/lib/entrance/preload-image";
import { getRecordDrinkImagePath } from "@/lib/entrance/record-drink-image";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { pickDrink } from "@/lib/drinks/pick-drink";

export const SCENE_REVEAL_PRELOAD_TIMING = {
  minMs: 250,
  maxMs: 500,
} as const;

const COUNTER_ENTRY_IMAGE_SOURCES = [
  ENTRANCE_ASSETS.counterBack,
  ENTRANCE_ASSETS.counterFront,
  ENTRANCE_ASSETS.masterIdle,
  ENTRANCE_ASSETS.lantern,
] as const;

let counterEntryPreloadPromise: Promise<void> | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** 単一失敗でも全体は続行 */
export function preloadSceneImages(sources: readonly string[]): Promise<void> {
  const unique = [...new Set(sources.filter(Boolean))];
  if (unique.length === 0) return Promise.resolve();

  return Promise.allSettled(unique.map((src) => preloadImage(src))).then(() => {});
}

/** masterOnBlack 中 — 入店カウンター主要画像 */
export function startCounterEntryScenePreload(): Promise<void> {
  if (!counterEntryPreloadPromise) {
    counterEntryPreloadPromise = preloadSceneImages(COUNTER_ENTRY_IMAGE_SOURCES);
  }
  return counterEntryPreloadPromise;
}

export function recordCounterSceneImageSources(
  drinkId: string | null | undefined,
): string[] {
  return [
    ENTRANCE_ASSETS.backRecord,
    ENTRANCE_ASSETS.counterRecord,
    getRecordDrinkImagePath(drinkId),
  ];
}

/** 感情確定の暗転中 — 録音カウンター主要画像 */
export function startRecordCounterScenePreload(
  drinkId: string | null | undefined,
): Promise<void> {
  return preloadSceneImages(recordCounterSceneImageSources(drinkId));
}

export function resolveMoodOptionDrinkId(option: MoodOption): string {
  const categoryId = option.id as DrinkCategoryId;
  if (option.resultDrinkId) return option.resultDrinkId;

  return pickDrink(categoryId, new Date(), {
    imageOnly: true,
    preferredDrinkId: option.resultDrinkId,
  }).id;
}

/**
 * 明転前ゲート — 最低 minMs、preload は最大 maxMs まで待つ。
 * 失敗・タイムアウトでも resolve する。
 */
export async function waitForSceneRevealPreload(
  preloadPromise: Promise<void> | null | undefined,
  timing: typeof SCENE_REVEAL_PRELOAD_TIMING = SCENE_REVEAL_PRELOAD_TIMING,
): Promise<void> {
  const cappedPreload = Promise.race([
    (preloadPromise ?? Promise.resolve()).catch(() => {}),
    delay(timing.maxMs),
  ]);

  await Promise.all([delay(timing.minMs), cappedPreload]);
}
