"use client";

import {
  BarSeatMoodPicker,
  type MoodOption,
} from "@/components/entrance/bar-seat-mood-picker";
import { DeclineNightLink } from "@/components/entrance/decline-night-link";
import { buildMoodPickerOptions } from "@/lib/entrance/mood-picker-options";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { getDrinkById } from "@/lib/drinks/drink-catalog";
import { pickDrink } from "@/lib/drinks/pick-drink";
import { useCallback, useMemo, useRef } from "react";

const MOOD_OPTION_BUTTON_WIDTH = "90%";

type MoodSelectPanelProps = {
  onSelect: (categoryId: DrinkCategoryId, drink: Drink) => void;
  onPastBottle: () => void;
  onDecline: () => void;
  onBeforeSelect?: (option: MoodOption, proceed: () => void) => void;
  declineDisabled?: boolean;
};

function resolveMoodOptionDrink(option: MoodOption): MoodOption {
  const categoryId = option.id as DrinkCategoryId;
  const drink = pickDrink(categoryId, new Date(), undefined, {
    imageOnly: true,
  });

  return {
    ...option,
    resultDrinkId: drink.id,
    resultLabel: drink.name,
    resultSub: drink.note ?? option.sub,
  };
}

export function MoodSelectPanel({
  onSelect,
  onPastBottle,
  onDecline,
  onBeforeSelect,
  declineDisabled = false,
}: MoodSelectPanelProps) {
  const options = useMemo(() => buildMoodPickerOptions(), []);
  const pendingDrinkRef = useRef<Drink | null>(null);

  const handleResolveOption = useCallback((option: MoodOption) => {
    const resolved = resolveMoodOptionDrink(option);
    pendingDrinkRef.current =
      getDrinkById(resolved.resultDrinkId ?? "") ?? null;
    return resolved;
  }, []);

  const handleBeforeSelect = useCallback(
    (option: MoodOption, proceed: () => void) => {
      if (!onBeforeSelect) {
        proceed();
        return;
      }
      onBeforeSelect(option, proceed);
    },
    [onBeforeSelect],
  );

  const handlePickerSelect = (option: MoodOption) => {
    const categoryId = option.id as DrinkCategoryId;
    const drink =
      pendingDrinkRef.current ??
      (option.resultDrinkId
        ? getDrinkById(option.resultDrinkId)
        : undefined) ??
      pickDrink(categoryId, new Date(), undefined, {
        imageOnly: true,
        preferredDrinkId: option.resultDrinkId,
      });

    pendingDrinkRef.current = null;
    onSelect(categoryId, drink);
  };

  return (
    <BarSeatMoodPicker
      options={options}
      promptText=""
      transparentBackground
      instantEntrance
      entranceDurationScale={2}
      resolveOption={handleResolveOption}
      onSelect={handlePickerSelect}
      onBeforeSelect={handleBeforeSelect}
      footer={
        <div className="mx-auto" style={{ width: MOOD_OPTION_BUTTON_WIDTH }}>
          <button
            type="button"
            onClick={onPastBottle}
            className="mt-1 w-full rounded-xl border border-white/[0.06] bg-transparent px-5 py-3 text-[11px] tracking-[0.2em] text-[#8b8fa3] transition-colors duration-500 hover:border-white/[0.14] hover:text-[#cdd6e8]"
          >
            過去のボトルから
          </button>
          <div className="pt-2 text-center">
            <DeclineNightLink onDecline={onDecline} disabled={declineDisabled} />
          </div>
        </div>
      }
    />
  );
}
