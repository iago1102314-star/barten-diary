import { MOOD_SELECT_ENTRANCE_DURATION_SCALE } from "@/lib/entrance/mood-select-entrance-tuning";
import { MOOD_SELECT_EXIT_TUNING } from "@/lib/entrance/mood-select-exit-tuning";

const scale = MOOD_SELECT_ENTRANCE_DURATION_SCALE;

export function moodSelectExitScaledSec(baseSec: number): number {
  return baseSec * scale;
}

export const MOOD_SELECT_EXIT_SCALED = {
  vignetteCloseDurationSec: moodSelectExitScaledSec(
    MOOD_SELECT_EXIT_TUNING.vignetteCloseDurationSec /
      MOOD_SELECT_EXIT_TUNING.uiReverseSpeedFactor,
  ),
  buttonMoveToCenterSec: moodSelectExitScaledSec(
    MOOD_SELECT_EXIT_TUNING.buttonMoveToCenterSec,
  ),
  buttonDissolveLeadSec: moodSelectExitScaledSec(
    MOOD_SELECT_EXIT_TUNING.buttonDissolveLeadSec,
  ),
  buttonDissolveSec: moodSelectExitScaledSec(
    MOOD_SELECT_EXIT_TUNING.buttonDissolveSec,
  ),
  grassFallbackDurationSec: moodSelectExitScaledSec(
    MOOD_SELECT_EXIT_TUNING.grassFallbackDurationSec,
  ),
} as const;
