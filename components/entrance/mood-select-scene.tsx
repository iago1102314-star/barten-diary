"use client";

import { MoodCurtain, type MoodCurtainPhase } from "@/components/entrance/mood-curtain";
import { MoodSelectPanel } from "@/components/entrance/mood-select-panel";
import type { MoodOption } from "@/components/entrance/bar-seat-mood-picker";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import { MOOD_CURTAIN } from "@/lib/entrance/mood-curtain";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { useCallback, useEffect, useRef, useState } from "react";

type MoodSelectSceneProps = {
  skipCurtainEntrance?: boolean;
  onCurtainEntranceComplete?: () => void;
  /** 選択確定 — 幕を下ろしてから注ぎ演出へ */
  onSelectionStart?: () => void;
  onSelect: (categoryId: DrinkCategoryId, drink: Drink) => void;
  onPastBottle: () => void;
  onDecline: () => void;
};

export function MoodSelectScene({
  skipCurtainEntrance = false,
  onCurtainEntranceComplete,
  onSelectionStart,
  onSelect,
  onPastBottle,
  onDecline,
}: MoodSelectSceneProps) {
  const [curtainPhase, setCurtainPhase] = useState<MoodCurtainPhase>(
    skipCurtainEntrance ? "hidden" : "dropping",
  );
  const [uiVisible, setUiVisible] = useState(skipCurtainEntrance);
  const proceedPourRef = useRef<(() => void) | null>(null);
  const entranceThinkPlayedRef = useRef(false);

  useEffect(() => {
    if (skipCurtainEntrance || entranceThinkPlayedRef.current) return;

    entranceThinkPlayedRef.current = true;
    barAudioEngine.playThink();
  }, [skipCurtainEntrance]);

  useEffect(() => {
    if (skipCurtainEntrance || curtainPhase !== "dropping") return;

    const revealMs =
      MOOD_CURTAIN.dropDurationSec *
      MOOD_CURTAIN.uiRevealAtDropRatio *
      1000;

    const timer = setTimeout(() => {
      setUiVisible(true);
    }, revealMs);

    return () => clearTimeout(timer);
  }, [skipCurtainEntrance, curtainPhase]);

  const handleDropComplete = useCallback(() => {
    setCurtainPhase("down");
    setUiVisible(true);
    onCurtainEntranceComplete?.();
  }, [onCurtainEntranceComplete]);

  const handleCloseComplete = useCallback(() => {
    setCurtainPhase("hidden");
    proceedPourRef.current?.();
    proceedPourRef.current = null;
  }, []);

  const handleBeforeSelect = useCallback(
    (option: MoodOption, proceed: () => void) => {
      proceedPourRef.current = proceed;
      onSelectionStart?.();
      barAudioEngine.playThink();
      setCurtainPhase("closing");
    },
    [onSelectionStart],
  );

  return (
    <>
      <MoodCurtain
        phase={curtainPhase}
        onDropComplete={handleDropComplete}
        onCloseComplete={handleCloseComplete}
      />

      {uiVisible && (
        <div
          className={`absolute inset-0 z-40 ${
            curtainPhase === "closing" ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          <MoodSelectPanel
            onSelect={onSelect}
            onPastBottle={onPastBottle}
            onDecline={onDecline}
            onBeforeSelect={handleBeforeSelect}
          />
        </div>
      )}
    </>
  );
}
