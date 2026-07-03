import {
  DRINK_NOTE_SCRIM_TUNING,
  buildDrinkNoteScrimGradient,
} from "@/lib/entrance/drink-name-reveal-tuning";

/** 録音カウンター内 — counter より手前（z=3）、説明文より下 */
export function RecordDrinkNoteScrim() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[3]"
      aria-hidden
      style={{
        height: `${DRINK_NOTE_SCRIM_TUNING.heightPercent}%`,
        background: buildDrinkNoteScrimGradient(),
      }}
    />
  );
}
