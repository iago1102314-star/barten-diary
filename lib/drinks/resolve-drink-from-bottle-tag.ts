import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import {
  DRINK_CATEGORIES,
  type Drink,
  type DrinkCategoryId,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";

export type ResolvedPastBottle = {
  drink: Drink;
  categoryId: DrinkCategoryId;
};

export function findCategoryIdForDrinkId(drinkId: DrinkId): DrinkCategoryId | null {
  for (const category of DRINK_CATEGORIES) {
    if (category.drinks.some((d) => d.id === drinkId)) {
      return category.id;
    }
  }
  return null;
}

/** Bottle Tag の酒名からカタログの drinkId を引く */
export function resolveDrinkFromBottleTag(
  bottleTag: string,
): ResolvedPastBottle | null {
  const { drinkName } = parseBottleTag(bottleTag);
  if (!drinkName) return null;

  for (const category of DRINK_CATEGORIES) {
    const drink = category.drinks.find((d) => d.name === drinkName);
    if (drink) {
      return { drink, categoryId: category.id };
    }
  }

  return null;
}

/** カタログに無い銘柄 — 表示・Bottle Tag 用のフォールバック */
export function fallbackDrinkFromName(drinkName: string): Drink {
  const slug = drinkName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    id: slug || "unknown-drink",
    name: drinkName,
  };
}
