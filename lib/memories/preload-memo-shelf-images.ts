import type { DiaryListItem } from "@/components/diaries/diary-list";
import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import { resolveDrinkFromBottleTag } from "@/lib/drinks/resolve-drink-from-bottle-tag";
import { resolveDiaryDrinkVisuals } from "@/lib/diary-paper/resolve-diary-drink-visuals";

export function preloadMemoShelfImages(memos: DiaryListItem[]) {
  if (typeof window === "undefined") return;

  for (const memo of memos) {
    const parsed = parseBottleTag(memo.title);
    const resolved = resolveDrinkFromBottleTag(memo.title);
    const drinkName =
      (resolved?.drink.name ?? parsed.drinkName.trim()) || undefined;
    const { drinkImageSrc, maskingTapeSrc } = resolveDiaryDrinkVisuals(
      memo.id,
      drinkName,
    );

    for (const src of [drinkImageSrc, maskingTapeSrc]) {
      if (!src) continue;
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    }
  }
}
