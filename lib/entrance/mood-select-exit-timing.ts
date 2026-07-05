import { MOOD_SELECT_ENTRANCE_DURATION_SCALE } from "@/lib/entrance/mood-select-entrance-tuning";
import { MOOD_SELECT_EXIT_TUNING } from "@/lib/entrance/mood-select-exit-tuning";

const scale = MOOD_SELECT_ENTRANCE_DURATION_SCALE;

export function moodSelectExitScaledSec(baseSec: number): number {
  return baseSec * scale;
}

export const MOOD_SELECT_EXIT_SCALED = {
  /** 入場ビネットと同秒数（× scale）— uiReverse より遅く侵食が見える */
  vignetteCloseDurationSec: moodSelectExitScaledSec(
    MOOD_SELECT_EXIT_TUNING.vignetteCloseDurationSec,
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
  /** 入場 scale 非適用 — iOS で ended が来ないときの過剰待ち（最大16s）を防ぐ */
  grassFallbackDurationSec: MOOD_SELECT_EXIT_TUNING.grassFallbackDurationSec,
} as const;
