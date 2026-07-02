import {
  getDrinkById,
  type Drink,
  type DrinkCategoryId,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";

/** 旧βカタログの銘柄 — Bottle Tag 表示名はそのまま、画像は β4種へ寄せる */
type LegacyDrinkEntry = {
  id: DrinkId;
  name: string;
  categoryId: DrinkCategoryId;
  visualDrinkId: DrinkId;
};

const LEGACY_DRINK_ENTRIES: LegacyDrinkEntry[] = [
  // heavy
  { id: "negroni", name: "Negroni", categoryId: "heavy", visualDrinkId: "old-fashioned" },
  {
    id: "yamazaki-12",
    name: "Yamazaki 18",
    categoryId: "heavy",
    visualDrinkId: "old-fashioned",
  },
  // clear
  {
    id: "koshu-legacy",
    name: "甲州ワイン（KOSHU）",
    categoryId: "clear",
    visualDrinkId: "koshu",
  },
  { id: "gin-tonic", name: "Gin Tonic", categoryId: "clear", visualDrinkId: "koshu" },
  {
    id: "chablis",
    name: "Chablis（シャブリ）",
    categoryId: "clear",
    visualDrinkId: "koshu",
  },
  { id: "espresso", name: "Espresso", categoryId: "clear", visualDrinkId: "koshu" },
  // glow
  {
    id: "moscato-dasti",
    name: "Moscato d'Asti",
    categoryId: "glow",
    visualDrinkId: "bellini",
  },
  {
    id: "kir-royale",
    name: "Kir Royale",
    categoryId: "glow",
    visualDrinkId: "bellini",
  },
  // sleepless
  {
    id: "irish-coffee",
    name: "Irish Coffee",
    categoryId: "sleepless",
    visualDrinkId: "hot-cocoa",
  },
  {
    id: "mulled-wine",
    name: "Mulled Wine",
    categoryId: "sleepless",
    visualDrinkId: "hot-cocoa",
  },
  { id: "brandy", name: "Brandy", categoryId: "sleepless", visualDrinkId: "hot-cocoa" },
  {
    id: "laphroaig-10",
    name: "Laphroaig 10年",
    categoryId: "sleepless",
    visualDrinkId: "hot-cocoa",
  },
  // master（旧）
  { id: "guinness", name: "Guinness", categoryId: "master", visualDrinkId: "old-fashioned" },
  { id: "dassai", name: "獺祭", categoryId: "master", visualDrinkId: "koshu" },
  { id: "yebisu", name: "YEBISU", categoryId: "master", visualDrinkId: "bellini" },
  {
    id: "talisker-10",
    name: "Talisker 10年",
    categoryId: "master",
    visualDrinkId: "hot-cocoa",
  },
];

const LEGACY_DRINK_BY_NAME = new Map<string, LegacyDrinkEntry>();
const LEGACY_DRINK_BY_ID = new Map<string, LegacyDrinkEntry>();

for (const entry of LEGACY_DRINK_ENTRIES) {
  LEGACY_DRINK_BY_NAME.set(entry.name, entry);
  LEGACY_DRINK_BY_NAME.set(entry.name.toLowerCase(), entry);
  LEGACY_DRINK_BY_ID.set(entry.id, entry);
}

export function resolveLegacyDrinkByName(
  drinkName: string,
): LegacyDrinkEntry | null {
  const trimmed = drinkName.trim();
  if (!trimmed) return null;
  return (
    LEGACY_DRINK_BY_NAME.get(trimmed) ??
    LEGACY_DRINK_BY_NAME.get(trimmed.toLowerCase()) ??
    null
  );
}

export function resolveLegacyDrinkById(
  drinkId: DrinkId,
): LegacyDrinkEntry | null {
  return LEGACY_DRINK_BY_ID.get(drinkId) ?? null;
}

export function legacyDrinkToCatalogDrink(entry: LegacyDrinkEntry): Drink {
  const visualDrink = getDrinkById(entry.visualDrinkId);
  return {
    id: entry.visualDrinkId,
    name: entry.name,
    displayNameJa: visualDrink?.displayNameJa,
    note: visualDrink?.note,
    masterComments: visualDrink?.masterComments ?? [],
  };
}

/** 画像解決用 — 旧銘柄名・旧 ID も β4種にマップ */
export function resolveVisualDrinkId(
  drinkId: DrinkId | null | undefined,
  drinkName?: string | null,
): DrinkId | null {
  if (drinkId) {
    const legacyById = resolveLegacyDrinkById(drinkId);
    if (legacyById) return legacyById.visualDrinkId;
  }

  if (drinkName) {
    const legacyByName = resolveLegacyDrinkByName(drinkName);
    if (legacyByName) return legacyByName.visualDrinkId;
  }

  return drinkId ?? null;
}
