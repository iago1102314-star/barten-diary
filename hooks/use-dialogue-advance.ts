"use client";

import { useCallback, useState } from "react";

/**
 * TapAdvance — タイプ完了までタップ無効、完了後に次セリフへ。
 */
export function useDialogueAdvance(
  lines: readonly string[],
  onComplete: () => void,
) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const last = index >= lines.length - 1;

  const advance = useCallback(() => {
    if (!done) return;

    if (last) {
      onComplete();
      return;
    }

    setDone(false);
    setIndex((current) => current + 1);
  }, [done, last, onComplete]);

  return {
    index,
    done,
    setDone,
    last,
    advance,
    currentLine: lines[index] ?? "",
  };
}
