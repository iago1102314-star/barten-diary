import type { Drink } from "@/lib/drinks/drink-catalog";
import { resolveDrinkKatakanaName } from "@/lib/drinks/drink-katakana-names";

export type DrinkNameRevealCopy = {
  englishName: string;
  katakanaName: string | null;
};

export function resolveDrinkNameRevealCopy(
  drink: Pick<Drink, "id" | "name">,
): DrinkNameRevealCopy {
  const englishName = drink.name.trim();

  return {
    englishName,
    katakanaName: resolveDrinkKatakanaName(drink.id, englishName),
  };
}
