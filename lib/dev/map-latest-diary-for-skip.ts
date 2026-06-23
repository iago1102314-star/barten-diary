import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import type { GeneratedDiary } from "@/lib/ai/types";
import type { DiaryListRow } from "@/lib/diaries/fetch-diaries";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";
import {
  fallbackDrinkFromName,
  findCategoryIdForDrinkId,
  resolveDrinkFromBottleTag,
} from "@/lib/drinks/resolve-drink-from-bottle-tag";

export type DevLatestDiarySnapshot = {
  transcript: string;
  bottleTag: string;
  categoryId: DrinkCategoryId;
  drinkId: DrinkId;
  drinkName: string;
  record: GeneratedDiary;
};

export function mapLatestDiaryForDevSkip(
  diary: DiaryListRow,
): DevLatestDiarySnapshot | null {
  const transcript = diary.transcript?.trim() ?? "";
  if (!transcript) return null;

  const bottleTag = diary.title.trim();
  const resolved = bottleTag ? resolveDrinkFromBottleTag(bottleTag) : null;
  const drinkName =
    parseBottleTag(bottleTag).drinkName || resolved?.drink.name || "Night Cap";
  const drink = resolved?.drink ?? fallbackDrinkFromName(drinkName);
  const categoryId =
    resolved?.categoryId ??
    findCategoryIdForDrinkId(drink.id) ??
    ("clear" as DrinkCategoryId);

  return {
    transcript,
    bottleTag,
    categoryId,
    drinkId: drink.id,
    drinkName: drink.name,
    record: {
      bottleTag,
      diary: diary.body,
      drinkNote: diary.drink_note?.trim() ?? "",
      masterComment: diary.master_comment?.trim() ?? "",
    },
  };
}
