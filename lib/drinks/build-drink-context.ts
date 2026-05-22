import {
  getDrinkCategoryById,
  type DrinkCategoryId,
} from "@/lib/drinks/drink-catalog";
import type { BottleTagAssembly } from "@/lib/bottle-tag/assemble-record";
import type { DiaryDrinkContext } from "@/lib/ai/types";

export function buildDrinkContext(
  categoryId: DrinkCategoryId,
  assembly: BottleTagAssembly,
): DiaryDrinkContext {
  const category = getDrinkCategoryById(categoryId);

  return {
    selectedCategoryId: categoryId,
    selectedCategoryLabel: category?.label ?? categoryId,
    selectedDrinkId: assembly.selectedDrinkId,
    selectedDrinkName: assembly.selectedDrinkName,
  };
}
