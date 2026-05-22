import {
  DRINK_CATEGORIES,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";

/**
 * public/assets/drinks/ に配置済みのファイル（{id}.webp）
 * メニューに銘柄を足したら、ここにも id を追加する
 */
export const DRINK_IMAGE_IDS = new Set<DrinkId>([
  "old-fashioned",
  "yamazaki-12",
  "gin-tonic",
  "espresso",
  "bellini",
  "irish-coffee",
]);

const DRINK_IMAGE_BY_NAME: Record<string, string> = {};

for (const category of DRINK_CATEGORIES) {
  for (const drink of category.drinks) {
    const path = getDrinkImagePath(drink.id);
    if (path) {
      DRINK_IMAGE_BY_NAME[drink.name] = path;
    }
  }
}

export function getDrinkImagePath(
  drinkId: DrinkId | null | undefined,
): string | null {
  if (!drinkId || !DRINK_IMAGE_IDS.has(drinkId)) return null;
  return `/assets/drinks/${drinkId}.webp`;
}

export function getDrinkImagePathByName(
  drinkName: string | null | undefined,
): string | null {
  if (!drinkName?.trim()) return null;
  return DRINK_IMAGE_BY_NAME[drinkName.trim()] ?? null;
}

export function drinkHasImage(drinkId: DrinkId): boolean {
  return DRINK_IMAGE_IDS.has(drinkId);
}
