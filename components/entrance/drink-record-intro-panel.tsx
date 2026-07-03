"use client";

import { unlockBarAudioForUserGesture } from "@/lib/entrance/bar-audio-engine";

export type RecordDrinkIntroPhase = "note" | "note-exit" | "sip-button";

type DrinkRecordIntroPanelProps = {
  introPhase: RecordDrinkIntroPhase;
  onRequestSipButton: () => void;
};

/**
 * 明転後 — 画面タップで note 退場（下部アクションは RecordBottomAction）
 */
export function DrinkRecordIntroPanel({
  introPhase,
  onRequestSipButton,
}: DrinkRecordIntroPanelProps) {
  if (introPhase !== "note") {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="続ける"
      onClick={() => {
        unlockBarAudioForUserGesture();
        onRequestSipButton();
      }}
      className="pointer-events-auto absolute inset-0 z-[41] cursor-default border-0 bg-transparent p-0 [-webkit-tap-highlight-color:transparent]"
    />
  );
}
