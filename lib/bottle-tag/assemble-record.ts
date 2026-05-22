import { buildBottleTag } from "@/lib/bottle-tag/build-bottle-tag";
import { pickDrink } from "@/lib/drinks/pick-drink";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import type {
  GeneratedDiary,
  GeneratedDiaryContent,
} from "@/lib/ai/types";

export type BottleTagAssembly = {
  bottleTag: string;
  selectedCategoryId: DrinkCategoryId;
  selectedDrinkId: string;
  selectedDrinkName: string;
};

export function assembleBottleTag(
  categoryId: DrinkCategoryId,
  recordedAt: string,
  timeZone?: string,
  preferredDrinkId?: string | null,
): BottleTagAssembly {
  const at = new Date(recordedAt);
  const drink = pickDrink(categoryId, at, timeZone, { preferredDrinkId });
  const bottleTag = buildBottleTag(at, drink.name, timeZone);

  return {
    bottleTag,
    selectedCategoryId: categoryId,
    selectedDrinkId: drink.id,
    selectedDrinkName: drink.name,
  };
}

export function assembleGeneratedDiary(
  content: GeneratedDiaryContent,
  assembly: BottleTagAssembly,
): GeneratedDiary {
  return {
    ...content,
    bottleTag: assembly.bottleTag,
  };
}
