"use client";

import { MoodSelectPanel } from "@/components/entrance/mood-select-panel";
import type { MoodOption } from "@/components/entrance/bar-seat-mood-picker";
import type { Drink } from "@/lib/drinks/drink-catalog";
import type { DrinkCategoryId } from "@/lib/drinks/drink-catalog";
import { useCallback } from "react";

type MoodSelectSceneProps = {
  /** 過去ボトル画面から戻る等 — 入場演出を省略（感情ボタン・また今度にする） */
  skipPastBottleEntrance?: boolean;
  /** 選択確定 — 退場演出開始 */
  onSelectionStart?: () => void;
  onRegisterExitSkip?: (skip: (() => void) | null) => void;
  onSelect: (categoryId: DrinkCategoryId, drink: Drink) => void;
  onDecline: () => void;
};

export function MoodSelectScene({
  onSelectionStart,
  onRegisterExitSkip,
  onSelect,
  onDecline,
  skipPastBottleEntrance = false,
}: MoodSelectSceneProps) {
  const handleConfirmStart = useCallback(
    (_option: MoodOption) => {
      onSelectionStart?.();
    },
    [onSelectionStart],
  );

  return (
    <div className="pointer-events-auto absolute inset-0 z-40">
      <MoodSelectPanel
        onSelect={onSelect}
        onDecline={onDecline}
        onConfirmStart={handleConfirmStart}
        onRegisterExitSkip={onRegisterExitSkip}
        skipPastBottleEntrance={skipPastBottleEntrance}
      />
    </div>
  );
}
