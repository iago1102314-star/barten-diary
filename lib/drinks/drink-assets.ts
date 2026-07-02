import {
  DRINK_CATEGORIES,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";
import { GENERATED_DRINK_ASSET_MANIFEST } from "@/lib/drinks/generated-drink-asset-manifest";
import {
  resolveLegacyDrinkByName,
  resolveVisualDrinkId,
} from "@/lib/drinks/legacy-drink-map";

/**
 * ドリンク画像 — `public/assets/drinks/{id}/`
 *
 * - `record.webp` … 録音カウンター（1枚。未配置時は diary/01 をフォールバック）
 * - `diary/01.webp`〜`04.webp` … 日記ポラロイド（seed で安定選択）
 *
 * 録音背景（back-record / counter-record）は
 * `lib/entrance/asset-paths.ts` の ENTRANCE_ASSETS。
 */

export type DrinkAssetEntry = {
  record: string;
  diary: readonly string[];
  thumbnail?: string;
};

/** 画像ファイルを配置済みのドリンク ID（β版4種） */
export const REGISTERED_DRINK_ASSET_IDS = [
  "old-fashioned",
  "koshu",
  "bellini",
  "hot-cocoa",
] as const;

export type RegisteredDrinkId = (typeof REGISTERED_DRINK_ASSET_IDS)[number];

/**
 * 日記ポラロイド画像 — 差し替え時は銘柄の ?v= を上げる（SW / ブラウザキャッシュ回避）
 */
export const DRINK_DIARY_ASSET_VERSION: Partial<
  Record<RegisteredDrinkId, number>
> = {};

function drinkDiaryAssetVersion(drinkId: RegisteredDrinkId): number {
  return DRINK_DIARY_ASSET_VERSION[drinkId] ?? 1;
}

export function buildDrinkRecordAssetPath(drinkId: DrinkId): string {
  return `/assets/drinks/${drinkId}/record.webp`;
}

export function buildDrinkDiaryAssetPath(
  drinkId: DrinkId,
  index: number,
): string {
  const version = drinkDiaryAssetVersion(drinkId as RegisteredDrinkId);
  return `/assets/drinks/${drinkId}/diary/${String(index).padStart(2, "0")}.webp?v=${version}`;
}

function buildDrinkAssetEntry(
  drinkId: RegisteredDrinkId,
): DrinkAssetEntry {
  const diaryIndices =
    GENERATED_DRINK_ASSET_MANIFEST[drinkId]?.diaryIndices ?? [1];
  const diary = diaryIndices.map((index) =>
    buildDrinkDiaryAssetPath(drinkId, index),
  );
  const hasRecord = GENERATED_DRINK_ASSET_MANIFEST[drinkId]?.hasRecord ?? false;

  return {
    record: hasRecord ? buildDrinkRecordAssetPath(drinkId) : diary[0] ?? "",
    diary,
    thumbnail: diary[0],
  };
}

/** 画像を登録したドリンクのみ。カタログ追加 ≠ 自動表示 */
export const DRINK_ASSETS = {
  "old-fashioned": buildDrinkAssetEntry("old-fashioned"),
  koshu: buildDrinkAssetEntry("koshu"),
  bellini: buildDrinkAssetEntry("bellini"),
  "hot-cocoa": buildDrinkAssetEntry("hot-cocoa"),
} as const satisfies Record<RegisteredDrinkId, DrinkAssetEntry>;

const DRINK_ID_BY_NAME = new Map<string, DrinkId>();

for (const category of DRINK_CATEGORIES) {
  for (const drink of category.drinks) {
    DRINK_ID_BY_NAME.set(drink.name, drink.id);
    DRINK_ID_BY_NAME.set(drink.name.toLowerCase(), drink.id);
  }
}

for (const legacy of [
  "Negroni",
  "Yamazaki 18",
  "甲州ワイン（KOSHU）",
  "Gin Tonic",
  "Chablis（シャブリ）",
  "Espresso",
  "Moscato d'Asti",
  "Kir Royale",
  "Irish Coffee",
  "Mulled Wine",
  "Brandy",
  "Laphroaig 10年",
  "Guinness",
  "獺祭",
  "YEBISU",
  "Talisker 10年",
] as const) {
  const resolved = resolveLegacyDrinkByName(legacy);
  if (resolved) {
    DRINK_ID_BY_NAME.set(legacy, resolved.visualDrinkId);
    DRINK_ID_BY_NAME.set(legacy.toLowerCase(), resolved.visualDrinkId);
  }
}

function stableSeedHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getDrinkAssetEntry(
  drinkId: DrinkId | null | undefined,
): DrinkAssetEntry | null {
  if (!drinkId) return null;
  const visualId = resolveVisualDrinkId(drinkId) as RegisteredDrinkId;
  return DRINK_ASSETS[visualId] ?? null;
}

export function resolveDrinkIdByName(
  drinkName: string | null | undefined,
): DrinkId | null {
  if (!drinkName?.trim()) return null;
  const trimmed = drinkName.trim();
  return (
    DRINK_ID_BY_NAME.get(trimmed) ??
    DRINK_ID_BY_NAME.get(trimmed.toLowerCase()) ??
    resolveLegacyDrinkByName(trimmed)?.visualDrinkId ??
    null
  );
}

export function drinkHasRecordImage(drinkId: DrinkId): boolean {
  return Boolean(getDrinkAssetEntry(drinkId)?.record);
}

export function drinkHasDiaryImage(drinkId: DrinkId): boolean {
  return (getDrinkAssetEntry(drinkId)?.diary.length ?? 0) > 0;
}

export function drinkHasVisualAssets(drinkId: DrinkId): boolean {
  const entry = getDrinkAssetEntry(drinkId);
  return Boolean(entry?.record || entry?.diary.length);
}

export function getDrinkRecordImagePath(
  drinkId: DrinkId | null | undefined,
): string | null {
  const entry = getDrinkAssetEntry(drinkId);
  if (!entry) return null;
  return entry.record ?? entry.diary[0] ?? entry.thumbnail ?? null;
}

export function getDrinkThumbnailPath(
  drinkId: DrinkId | null | undefined,
): string | null {
  const entry = getDrinkAssetEntry(drinkId);
  if (!entry) return null;
  return entry.thumbnail ?? entry.diary[0] ?? entry.record ?? null;
}

export function getDrinkThumbnailPathByName(
  drinkName: string | null | undefined,
): string | null {
  return getDrinkThumbnailPath(resolveDrinkIdByName(drinkName));
}

const FALLBACK_DIARY_DRINK_ID: RegisteredDrinkId = "old-fashioned";

function fallbackDiaryImage(seed: string): string {
  const diary = DRINK_ASSETS[FALLBACK_DIARY_DRINK_ID].diary;
  if (diary.length === 1) return diary[0]!;
  return diary[stableSeedHash(`${seed}:diary-fallback`) % diary.length]!;
}

/** 日記紙ポラロイド — diary 配列から seed で1枚（毎回同じ）。 */
export function pickDiaryDrinkImagePath(
  drinkId: DrinkId | null | undefined,
  seed: string,
): string | null {
  const visualId = resolveVisualDrinkId(drinkId) as RegisteredDrinkId | null;
  const diary = visualId ? DRINK_ASSETS[visualId]?.diary : null;
  if (!diary?.length) {
    return fallbackDiaryImage(seed);
  }
  if (diary.length === 1) return diary[0]!;
  return diary[stableSeedHash(`${seed}:diary-image`) % diary.length]!;
}

export function pickDiaryDrinkImagePathByName(
  drinkName: string | null | undefined,
  seed: string,
): string | null {
  return pickDiaryDrinkImagePath(resolveDrinkIdByName(drinkName), seed);
}
