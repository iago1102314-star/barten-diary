import type { DrinkId } from "@/lib/drinks/drink-catalog";

/** 酒名表示 — 英語名の下に出すカタカナ読み */
export const DRINK_KATAKANA_NAMES: Partial<Record<DrinkId, string>> = {
  "old-fashioned": "オールドファッション",
  koshu: "コウシュウ",
  bellini: "ベリーニ",
  "hot-cocoa": "ホットココア",
};

export function resolveDrinkKatakanaName(
  drinkId: DrinkId,
  drinkName: string,
): string | null {
  const mapped = DRINK_KATAKANA_NAMES[drinkId]?.trim();
  if (mapped) return mapped;

  const name = drinkName.trim();
  if (/^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(name)) {
    return name;
  }

  return null;
}
