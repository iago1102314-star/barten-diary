import type { DrinkId } from "@/lib/drinks/drink-catalog";

/** 酒名表示 — 英語名の下に出すカタカナ読み */
export const DRINK_KATAKANA_NAMES: Partial<Record<DrinkId, string>> = {
  "old-fashioned": "オールドファッション",
  negroni: "ネグローニ",
  "yamazaki-12": "ヤマザキ18年",
  koshu: "甲州ワイン",
  "gin-tonic": "ジントニック",
  chablis: "シャブリ",
  espresso: "エスプレッソ",
  bellini: "ベリーニ",
  "moscato-dasti": "モスカート・ダスティ",
  "kir-royale": "キールロワイヤル",
  "irish-coffee": "アイリッシュコーヒー",
  "mulled-wine": "ホットワイン",
  brandy: "ブランデー",
  "laphroaig-10": "ラフロイグ10年",
  guinness: "ギネス",
  dassai: "ダッサイ",
  yebisu: "ヱビス",
  "talisker-10": "タリスカー10年",
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
