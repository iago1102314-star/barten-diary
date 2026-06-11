import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";

/** 気分カテゴリごとのカウンター上の暖色脈動 */
export const MOOD_ACCENT: Record<string, string> = {
  heavy: "rgba(180, 96, 58, 0.14)",
  clear: "rgba(140, 168, 198, 0.1)",
  glow: "rgba(220, 168, 96, 0.13)",
  sleepless: "rgba(120, 100, 180, 0.11)",
  master: "rgba(201, 166, 107, 0.12)",
};

export function moodAccent(categoryId: DrinkCategoryId | null): string {
  if (!categoryId) return MOOD_ACCENT.master;
  return MOOD_ACCENT[categoryId] ?? MOOD_ACCENT.master;
}
