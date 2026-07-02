"use client";

import {
  BarSeatMoodPicker,
  type MoodOption,
} from "@/components/entrance/bar-seat-mood-picker";
import { DeclineNightLink } from "@/components/entrance/decline-night-link";
import {
  DECLINE_LINK_ENTRANCE_DELAY_SEC,
  MOOD_OPTION_ENTRANCE_BASE_DELAY_SEC,
  MOOD_SELECT_UI_ENTRANCE_SPEED_FACTOR,
  MOOD_SELECT_ENTRANCE_DURATION_SCALE,
} from "@/lib/entrance/mood-select-entrance-tuning";
import { buildMoodPickerOptions } from "@/lib/entrance/mood-picker-options";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { resolveDrinkById } from "@/lib/drinks/resolve-drink-from-bottle-tag";
import { pickDrink } from "@/lib/drinks/pick-drink";
import { useCallback, useMemo, useRef } from "react";

type MoodSelectPanelProps = {
  onSelect: (categoryId: DrinkCategoryId, drink: Drink) => void;
  onDecline: () => void;
  onConfirmStart?: (option: MoodOption) => void;
  onRegisterExitSkip?: (skip: (() => void) | null) => void;
  declineDisabled?: boolean;
  skipPastBottleEntrance?: boolean;
};

function resolveMoodOptionDrink(option: MoodOption): MoodOption {
  const categoryId = option.id as DrinkCategoryId;
  const drink = pickDrink(categoryId, new Date(), {
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
  onDecline,
  onConfirmStart,
  onRegisterExitSkip,
  declineDisabled = false,
  skipPastBottleEntrance = false,
}: MoodSelectPanelProps) {
  const options = useMemo(() => buildMoodPickerOptions(), []);
  const pendingDrinkRef = useRef<Drink | null>(null);

  const handleResolveOption = useCallback((option: MoodOption) => {
    const resolved = resolveMoodOptionDrink(option);
    pendingDrinkRef.current =
      resolveDrinkById(resolved.resultDrinkId ?? "") ?? null;
    return resolved;
  }, []);

  const handleConfirmExitComplete = useCallback(
    (option: MoodOption) => {
      const categoryId = option.id as DrinkCategoryId;
      const drink =
        pendingDrinkRef.current ??
        (option.resultDrinkId
          ? resolveDrinkById(option.resultDrinkId)
          : undefined) ??
        pickDrink(categoryId, new Date(), {
          imageOnly: true,
          preferredDrinkId: option.resultDrinkId,
        });

      pendingDrinkRef.current = null;
      onSelect(categoryId, drink);
    },
    [onSelect],
  );

  return (
    <BarSeatMoodPicker
      options={options}
      promptText=""
      transparentBackground
      instantEntrance
      skipOptionEntrance={skipPastBottleEntrance}
      showPourAnimation={false}
      entranceDurationScale={MOOD_SELECT_ENTRANCE_DURATION_SCALE}
      optionEntranceSpeedFactor={MOOD_SELECT_UI_ENTRANCE_SPEED_FACTOR}
      optionEntranceBaseDelaySec={
        skipPastBottleEntrance ? 0 : MOOD_OPTION_ENTRANCE_BASE_DELAY_SEC
      }
      resolveOption={handleResolveOption}
      onSelect={() => {}}
      onConfirmStart={onConfirmStart}
      onConfirmExitComplete={handleConfirmExitComplete}
      onRegisterExitSkip={onRegisterExitSkip}
      footer={
        <DeclineNightLink
          onDecline={onDecline}
          disabled={declineDisabled}
          showDivider
          entranceDelaySec={skipPastBottleEntrance ? undefined : DECLINE_LINK_ENTRANCE_DELAY_SEC}
        />
      }
    />
  );
}
