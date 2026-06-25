import {
  DRINK_CATEGORIES,
  type Drink,
  type DrinkCategoryId,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";
import { drinkHasImage } from "@/lib/entrance/drink-image-path";

const DEFAULT_TIME_ZONE = "Asia/Tokyo";

/** heavy + 画像あり — Old Fashioned / Yamazaki 18 を半々 */
const HEAVY_VISUAL_DRINK_IDS = ["old-fashioned", "yamazaki-12"] as const satisfies readonly DrinkId[];

function getSelectableDrinks(categoryId: DrinkCategoryId): Drink[] {
  const category = DRINK_CATEGORIES.find((c) => c.id === categoryId);
  return category?.drinks ?? [];
}

function buildSeed(
  at: Date,
  categoryId: DrinkCategoryId,
  tz: string,
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(at);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return (
    get("year") * 10000 +
    get("month") * 100 +
    get("day") * 10 +
    get("hour") +
    get("minute") +
    categoryId.length
  );
}

type PickDrinkOptions = {
  /** 画像がある銘柄だけから選ぶ（UI表示用。全員画像無しなら通常プールにフォールバック） */
  imageOnly?: boolean;
  /** 指定時はその銘柄を優先（生成APIとの一致用） */
  preferredDrinkId?: DrinkId | null;
  /** 省略時は Asia/Tokyo */
  timeZone?: string;
};

function resolvePickDrinkArgs(
  timeZoneOrOptions?: string | PickDrinkOptions,
  maybeOptions?: PickDrinkOptions,
): { tz: string; options: PickDrinkOptions } {
  if (typeof timeZoneOrOptions === "string") {
    return {
      tz: timeZoneOrOptions || DEFAULT_TIME_ZONE,
      options: maybeOptions ?? {},
    };
  }

  const options = timeZoneOrOptions ?? {};
  return {
    tz: options.timeZone ?? DEFAULT_TIME_ZONE,
    options,
  };
}

/**
 * カテゴリ内から1杯を選ぶ（決定的な簡易ロジック）
 */
export function pickDrink(
  categoryId: DrinkCategoryId,
  at: Date,
  timeZoneOrOptions?: string | PickDrinkOptions,
  maybeOptions?: PickDrinkOptions,
): Drink {
  const { tz, options } = resolvePickDrinkArgs(timeZoneOrOptions, maybeOptions);
  let pool = getSelectableDrinks(categoryId);

  if (options.preferredDrinkId) {
    const preferred = pool.find((d) => d.id === options.preferredDrinkId);
    if (preferred) return preferred;
  }

  if (options.imageOnly) {
    const visualPool = pool.filter((d) => drinkHasImage(d.id));
    if (visualPool.length > 0) {
      pool = visualPool;
    }
  }

  if (options.imageOnly && categoryId === "heavy") {
    const heavyPair = HEAVY_VISUAL_DRINK_IDS.map((id) =>
      pool.find((d) => d.id === id),
    ).filter((d): d is Drink => d !== undefined);
    if (heavyPair.length === 2) {
      return heavyPair[Math.random() < 0.5 ? 0 : 1]!;
    }
  }

  if (pool.length === 0) {
    return { id: "night-cap", name: "Night Cap" };
  }

  const seed = buildSeed(at, categoryId, tz);
  return pool[seed % pool.length]!;
}
