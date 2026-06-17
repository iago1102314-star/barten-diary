"use client";

import {
  BarSeatMoodPicker,
  type MoodOption,
} from "@/components/entrance/bar-seat-mood-picker";
import { DeclineNightLink } from "@/components/entrance/decline-night-link";
import { MoodOrnamentalDivider } from "@/components/entrance/mood-ornamental-divider";
import { PastBottleLink } from "@/components/entrance/past-bottle-link";
import { DECLINE_NIGHT_LINK_TUNING } from "@/lib/entrance/decline-night-link-tuning";
import { buildMoodPickerOptions } from "@/lib/entrance/mood-picker-options";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { getDrinkById } from "@/lib/drinks/drink-catalog";
import { pickDrink } from "@/lib/drinks/pick-drink";
import { useCallback, useMemo, useRef } from "react";

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
      header={<PastBottleLink onClick={onPastBottle} />}
      footer={
        <div className="mx-auto w-[90%]">
          <MoodOrnamentalDivider
            variant="moodFooter"
            color={DECLINE_NIGHT_LINK_TUNING.text.color}
            style={{
              marginBottom: DECLINE_NIGHT_LINK_TUNING.divider.marginBottomPx,
              transform: `translate(${DECLINE_NIGHT_LINK_TUNING.divider.offsetXpx}px, ${DECLINE_NIGHT_LINK_TUNING.divider.offsetYpx}px)`,
            }}
          />
          <div className="text-center">
            <DeclineNightLink onDecline={onDecline} disabled={declineDisabled} />
          </div>
        </div>
      }
    />
  );
}
