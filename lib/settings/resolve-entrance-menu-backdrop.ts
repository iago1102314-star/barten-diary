import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
import type { SettingsMenuBackdrop } from "@/lib/settings/settings-menu-backdrop";
import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";

type EntranceState =
  | "entry"
  | "memories"
  | "masterOnBlack"
  | "counterReveal"
  | "moodPrompt"
  | "moodSelect"
  | "pastBottleSelect"
  | "decliningNight"
  | "declineFarewellOnBlack"
  | "unheldNight"
  | "drinkServed"
  | "recording"
  | "postRecordBlackout"
  | "postRecordThanks"
  | "postRecordExitBlack"
  | "leaving"
  | "alley";

const COUNTER_SCENE_STATES = new Set<EntranceState>([
  "counterReveal",
  "moodPrompt",
  "moodSelect",
  "pastBottleSelect",
  "decliningNight",
  "unheldNight",
  "drinkServed",
  "recording",
  "postRecordBlackout",
]);

const RECORD_COUNTER_STATES = new Set<EntranceState>([
  "drinkServed",
  "recording",
  "postRecordBlackout",
]);

type ResolveEntranceMenuBackdropInput = {
  entranceState: EntranceState;
  moodCategoryId: DrinkCategoryId | null;
  moodCameraPose: CameraPose;
  pickedDrinkId: DrinkId | null;
  moodSelectExitActive: boolean;
  declineBlackoutReady: boolean;
};

/** entrance-flow の状態 → メニュー背景（UI なし） */
export function resolveEntranceMenuBackdrop(
  input: ResolveEntranceMenuBackdropInput,
): SettingsMenuBackdrop {
  const {
    entranceState,
    moodCategoryId,
    moodCameraPose,
    pickedDrinkId,
    moodSelectExitActive,
    declineBlackoutReady,
  } = input;

  if (entranceState === "entry") {
    return { kind: "home" };
  }

  if (entranceState === "memories") {
    return { kind: "memories-shelf" };
  }

  if (
    entranceState === "masterOnBlack" ||
    entranceState === "declineFarewellOnBlack" ||
    entranceState === "postRecordExitBlack" ||
    (entranceState === "decliningNight" && declineBlackoutReady)
  ) {
    return { kind: "black" };
  }

  if (entranceState === "leaving") {
    return { kind: "leaving" };
  }

  if (entranceState === "alley") {
    return { kind: "after-night" };
  }

  if (entranceState === "postRecordThanks") {
    return { kind: "counter" };
  }

  if (COUNTER_SCENE_STATES.has(entranceState)) {
    if (RECORD_COUNTER_STATES.has(entranceState)) {
      return {
        kind: "record-counter",
        drinkId: pickedDrinkId,
      };
    }

    const isDeclineFading =
      entranceState === "decliningNight" && !declineBlackoutReady;
    const showMoodParallaxCamera =
      (entranceState === "moodSelect" ||
        entranceState === "pastBottleSelect" ||
        isDeclineFading) &&
      !moodSelectExitActive;

    return {
      kind: "counter",
      moodCategoryId,
      cameraPose: showMoodParallaxCamera ? moodCameraPose : "neutral",
    };
  }

  return { kind: "black" };
}
