import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import {
  DRINK_CATEGORIES,
  getDrinkById,
  type Drink,
  type DrinkCategoryId,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";
import {
  legacyDrinkToCatalogDrink,
  resolveLegacyDrinkById,
  resolveLegacyDrinkByName,
} from "@/lib/drinks/legacy-drink-map";

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

  const legacy = resolveLegacyDrinkById(drinkId);
  return legacy?.categoryId ?? null;
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

  const legacy = resolveLegacyDrinkByName(drinkName);
  if (legacy) {
    return {
      drink: legacyDrinkToCatalogDrink(legacy),
      categoryId: legacy.categoryId,
    };
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
    masterComments: [],
  };
}

/** セッション復元など — βカタログ + 旧 ID */
export function resolveDrinkById(drinkId: DrinkId): Drink | undefined {
  const current = getDrinkById(drinkId);
  if (current) return current;

  const legacy = resolveLegacyDrinkById(drinkId);
  if (legacy) return legacyDrinkToCatalogDrink(legacy);

  return undefined;
}
