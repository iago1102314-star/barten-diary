import {
  buildDrinkDiaryAssetPath,
  getDrinkRecordImagePath as resolveDrinkRecordImagePath,
} from "@/lib/drinks/drink-assets";
import type { DrinkId } from "@/lib/drinks/drink-catalog";

const FALLBACK_RECORD_DRINK_ID: DrinkId = "old-fashioned";

/** 録音カウンター — ドリンクごと record 画像（未登録時 diary/01） */
export function getRecordDrinkImagePath(
  drinkId: DrinkId | null | undefined = FALLBACK_RECORD_DRINK_ID,
): string {
  return (
    resolveDrinkRecordImagePath(drinkId) ??
    buildDrinkDiaryAssetPath(FALLBACK_RECORD_DRINK_ID, 1)
  );
}

/** @deprecated `getRecordDrinkImagePath("old-fashioned")` */
export const RECORD_DRINK_IMAGE_PATH = getRecordDrinkImagePath(
  FALLBACK_RECORD_DRINK_ID,
);
