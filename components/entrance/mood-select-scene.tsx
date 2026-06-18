"use client";

import { MoodCurtain, type MoodCurtainPhase } from "@/components/entrance/mood-curtain";
import { MoodSelectPanel } from "@/components/entrance/mood-select-panel";
import type { MoodOption } from "@/components/entrance/bar-seat-mood-picker";
import { barAudioEngine } from "@/lib/entrance/bar-audio-engine";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { useCallback, useEffect, useRef, useState } from "react";

type MoodSelectSceneProps = {
  /** @deprecated 入場幕演出は廃止。常にUIを即表示 */
  skipCurtainEntrance?: boolean;
  /** 過去ボトル画面から戻る等 —「過去のボトルから」出現演出を省略 */
  skipPastBottleEntrance?: boolean;
  onCurtainEntranceComplete?: () => void;
  /** 選択確定 — 幕を閉じてから注ぎ演出へ */
  onSelectionStart?: () => void;
  onSelect: (categoryId: DrinkCategoryId, drink: Drink) => void;
  onPastBottle: () => void;
  onDecline: () => void;
};

export function MoodSelectScene({
  onCurtainEntranceComplete,
  onSelectionStart,
  onSelect,
  onPastBottle,
  onDecline,
  skipPastBottleEntrance = false,
}: MoodSelectSceneProps) {
  // 入場幕は廃止。UI は常に即表示。幕は選択時の「閉じる」のみ使用。
  const [curtainPhase, setCurtainPhase] = useState<MoodCurtainPhase>("hidden");
  const proceedPourRef = useRef<(() => void) | null>(null);

  // 入場完了コールバックをマウント時に一度だけ呼ぶ
  useEffect(() => {
    onCurtainEntranceComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onDropComplete={() => {}}
        onCloseComplete={handleCloseComplete}
      />

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
          skipPastBottleEntrance={skipPastBottleEntrance}
        />
      </div>
    </>
  );
}
