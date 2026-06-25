"use client";

import { useRapidTapSkip } from "@/hooks/use-rapid-tap-skip";
import { useEffect } from "react";

type EntranceTapSkipLayerProps = {
  active: boolean;
  onSkip: () => void;
  zIndex: number;
  ariaLabel?: string;
};

/** 待ち演出中 — 画面連打でスキップ（透明ヒットエリア） */
export function EntranceTapSkipLayer({
  active,
  onSkip,
  zIndex,
  ariaLabel = "演出をスキップ",
}: EntranceTapSkipLayerProps) {
  const { registerTap, resetStreak } = useRapidTapSkip(onSkip);

  useEffect(() => {
    if (!active) {
      resetStreak();
    }
  }, [active, resetStreak]);

  if (!active) return null;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={registerTap}
      className="pointer-events-auto absolute inset-0 cursor-default border-0 bg-transparent p-0 [-webkit-tap-highlight-color:transparent]"
      style={{ zIndex }}
    />
  );
}
