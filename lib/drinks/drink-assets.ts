import {
  DRINK_CATEGORIES,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";

/**
 * ドリンク画像 — `public/assets/drinks/{id}/`
 *
 * - `record.webp` … 録音カウンター（1枚）
 * - `diary/01.webp` … 日記ポラロイド（複数可、seed で安定選択）
 *
 * 録音背景（back-record / counter-record）は
 * `lib/entrance/asset-paths.ts` の ENTRANCE_ASSETS。
 */

export type DrinkAssetEntry = {
  record: string;
  diary: readonly string[];
  thumbnail?: string;
};

/** 画像ファイルを配置済みのドリンク ID */
export const REGISTERED_DRINK_ASSET_IDS = [
  "old-fashioned",
  "negroni",
  "yamazaki-12",
  "gin-tonic",
  "espresso",
  "bellini",
  "irish-coffee",
] as const;

export type RegisteredDrinkId = (typeof REGISTERED_DRINK_ASSET_IDS)[number];

/**
 * 日記ポラロイド画像 — 差し替え時は銘柄の ?v= を上げる（SW / ブラウザキャッシュ回避）
 * 未指定銘柄は 1
 */
export const DRINK_DIARY_ASSET_VERSION: Partial<
  Record<RegisteredDrinkId, number>
> = {
  negroni: 2,
};

/**
 * 【一時】true なら全日記ポラロイドを negroni/diary/01 に統一。
 * 元に戻すときは false に。
 */
export const TEMPORARY_USE_NEGRONI_01_FOR_ALL_DIARIES = true;

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
  diaryIndices: readonly number[] = [1],
): DrinkAssetEntry {
  return {
    record: buildDrinkRecordAssetPath(drinkId),
    diary: diaryIndices.map((index) => buildDrinkDiaryAssetPath(drinkId, index)),
  };
}

/** 画像を登録したドリンクのみ。カタログ追加 ≠ 自動表示 */
export const DRINK_ASSETS = {
  "old-fashioned": buildDrinkAssetEntry("old-fashioned"),
  negroni: buildDrinkAssetEntry("negroni"),
  "yamazaki-12": buildDrinkAssetEntry("yamazaki-12"),
  "gin-tonic": buildDrinkAssetEntry("gin-tonic"),
  espresso: buildDrinkAssetEntry("espresso"),
  bellini: buildDrinkAssetEntry("bellini"),
  "irish-coffee": buildDrinkAssetEntry("irish-coffee"),
} as const satisfies Record<RegisteredDrinkId, DrinkAssetEntry>;

const DRINK_ID_BY_NAME = new Map<string, DrinkId>();

for (const category of DRINK_CATEGORIES) {
  for (const drink of category.drinks) {
    DRINK_ID_BY_NAME.set(drink.name, drink.id);
    DRINK_ID_BY_NAME.set(drink.name.toLowerCase(), drink.id);
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
  return DRINK_ASSETS[drinkId as RegisteredDrinkId] ?? null;
}

export function resolveDrinkIdByName(
  drinkName: string | null | undefined,
): DrinkId | null {
  if (!drinkName?.trim()) return null;
  const trimmed = drinkName.trim();
  return (
    DRINK_ID_BY_NAME.get(trimmed) ??
    DRINK_ID_BY_NAME.get(trimmed.toLowerCase()) ??
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
  return getDrinkAssetEntry(drinkId)?.record ?? null;
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

function temporaryDiaryImageForAll(): string {
  return buildDrinkDiaryAssetPath("negroni", 1);
}

/** 日記紙ポラロイド — diary 配列から seed で1枚（毎回同じ）。 */
export function pickDiaryDrinkImagePath(
  drinkId: DrinkId | null | undefined,
  seed: string,
): string | null {
  if (TEMPORARY_USE_NEGRONI_01_FOR_ALL_DIARIES) {
    return temporaryDiaryImageForAll();
  }

  const diary = getDrinkAssetEntry(drinkId as RegisteredDrinkId)?.diary;
  if (!diary?.length) return null;
  if (diary.length === 1) return diary[0]!;
  return diary[stableSeedHash(`${seed}:diary-image`) % diary.length]!;
}

export function pickDiaryDrinkImagePathByName(
  drinkName: string | null | undefined,
  seed: string,
): string | null {
  if (TEMPORARY_USE_NEGRONI_01_FOR_ALL_DIARIES) {
    return temporaryDiaryImageForAll();
  }
  return pickDiaryDrinkImagePath(resolveDrinkIdByName(drinkName), seed);
}
