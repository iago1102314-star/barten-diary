"use client";

import { DeclineNightLink } from "@/components/entrance/decline-night-link";
import { MasterLine } from "@/components/entrance/master-line";
import {
  DRINK_CATEGORIES,
  type Drink,
  type DrinkCategory,
  type DrinkCategoryId,
} from "@/lib/drinks/drink-catalog";
import { pickDrink } from "@/lib/drinks/pick-drink";

type MoodSelectPanelProps = {
  onSelect: (categoryId: DrinkCategoryId, drink: Drink) => void;
  onPastBottle: () => void;
  onDecline: () => void;
  declineDisabled?: boolean;
};

function MoodItem({
  category,
  onSelect,
}: {
  category: DrinkCategory;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-xl border border-stone-900/80 bg-stone-950/55 px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:border-stone-700/70 hover:bg-stone-950/70"
    >
      <p className="text-sm tracking-wide text-stone-200/95">{category.label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-500/90">
        {category.description}
      </p>
    </button>
  );
}

export function MoodSelectPanel({
  onSelect,
  onPastBottle,
  onDecline,
  declineDisabled = false,
}: MoodSelectPanelProps) {
  const handleSelect = (categoryId: DrinkCategoryId) => {
    const drink = pickDrink(categoryId, new Date(), undefined, {
      imageOnly: true,
    });
    onSelect(categoryId, drink);
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-4 px-2">
      <MasterLine>……今日はどうしようか？</MasterLine>

      <div className="space-y-3">
        {DRINK_CATEGORIES.map((category) => (
          <MoodItem
            key={category.id}
            category={category}
            onSelect={() => handleSelect(category.id)}
          />
        ))}

        <button
          type="button"
          onClick={onPastBottle}
          className="mt-2 w-full rounded-lg border border-stone-800/45 bg-transparent px-4 py-2.5 text-[12px] tracking-[0.14em] text-stone-500/75 opacity-80 transition-colors hover:border-stone-700/50 hover:text-stone-400/90"
        >
          過去のボトルから
        </button>
      </div>

      <DeclineNightLink onDecline={onDecline} disabled={declineDisabled} />
    </div>
  );
}
