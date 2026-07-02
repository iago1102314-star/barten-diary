import {
  DRINK_CATEGORIES,
  getBetaDrinks,
  MASTER_DELEGATE_CATEGORY_ID,
  type Drink,
  type DrinkCategoryId,
  type DrinkId,
} from "@/lib/drinks/drink-catalog";
import { drinkHasImage } from "@/lib/entrance/drink-image-path";

const DEFAULT_TIME_ZONE = "Asia/Tokyo";

function getSelectableDrinks(categoryId: DrinkCategoryId): Drink[] {
  if (categoryId === MASTER_DELEGATE_CATEGORY_ID) {
    return getBetaDrinks();
  }

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
 * master は β4種から日時 seed で1杯。
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
    const preferred =
      pool.find((d) => d.id === options.preferredDrinkId) ??
      getBetaDrinks().find((d) => d.id === options.preferredDrinkId);
    if (preferred) return preferred;
  }

  if (options.imageOnly) {
    const visualPool = pool.filter((d) => drinkHasImage(d.id));
    if (visualPool.length > 0) {
      pool = visualPool;
    }
  }

  if (pool.length === 0) {
    return { id: "night-cap", name: "Night Cap", masterComments: [] };
  }

  const seed = buildSeed(at, categoryId, tz);
  return pool[seed % pool.length]!;
}
