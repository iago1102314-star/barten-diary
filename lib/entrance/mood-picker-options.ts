import type { MoodOption } from "@/components/entrance/bar-seat-mood-picker";
import { DRINK_CATEGORIES } from "@/lib/drinks/drink-catalog";
import { pickDrink } from "@/lib/drinks/pick-drink";

const MOOD_COLORS: Record<
  string,
  { color: string; glow: string }
> = {
  heavy: { color: "#c96f3a", glow: "rgba(201,111,58,0.35)" },
  clear: { color: "#5a7d9a", glow: "rgba(90,125,154,0.35)" },
  glow: { color: "#b05a72", glow: "rgba(176,90,114,0.35)" },
  sleepless: { color: "#c9a13a", glow: "rgba(201,161,58,0.4)" },
  master: { color: "#7a7a8c", glow: "rgba(219, 219, 219, 0.35)" },
};

/** カタログの気分カテゴリ → BarSeat 選択肢（注ぎ演出用ラベル付き） */
export function buildMoodPickerOptions(): MoodOption[] {
  return DRINK_CATEGORIES.map((category) => {
    const drink = pickDrink(category.id, new Date(), {
      imageOnly: true,
    });
    const palette = MOOD_COLORS[category.id] ?? MOOD_COLORS.master;

    return {
      id: category.id,
      label: category.label,
      sub: category.description,
      color: palette.color,
      glow: palette.glow,
      resultLabel: drink.name,
      resultSub: drink.note ?? category.description,
    };
  });
}
