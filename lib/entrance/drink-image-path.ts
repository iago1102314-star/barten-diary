import type { DrinkId } from "@/lib/drinks/drink-catalog";
import {
  DRINK_ASSETS,
  drinkHasVisualAssets,
  getDrinkThumbnailPath,
  getDrinkThumbnailPathByName,
  type RegisteredDrinkId,
} from "@/lib/drinks/drink-assets";

/**
 * @deprecated `DRINK_ASSETS` のキー集合。新規コードは `drinkHasVisualAssets` を使う。
 */
export const DRINK_IMAGE_IDS = new Set<DrinkId>(
  Object.keys(DRINK_ASSETS) as RegisteredDrinkId[],
);

/** @deprecated `getDrinkThumbnailPath` — 棚・カウンター用サムネ */
export function getDrinkImagePath(
  drinkId: DrinkId | null | undefined,
): string | null {
  return getDrinkThumbnailPath(drinkId);
}

/** @deprecated `getDrinkThumbnailPathByName` */
export function getDrinkImagePathByName(
  drinkName: string | null | undefined,
): string | null {
  return getDrinkThumbnailPathByName(drinkName);
}

/** @deprecated `drinkHasVisualAssets` */
export function drinkHasImage(drinkId: DrinkId): boolean {
  return drinkHasVisualAssets(drinkId);
}
