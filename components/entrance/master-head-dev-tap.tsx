"use client";

import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";
import { useCallback, useRef } from "react";

const TAP_WINDOW_MS = 2000;
const REQUIRED_TAPS = 3;

type MasterHeadDevTapZoneProps = {
  onTripleTap: () => void;
  enabled?: boolean;
};

/** DEV — マスターの頭付近を3回タップでショートカット */
export function MasterHeadDevTapZone({
  onTripleTap,
  enabled = true,
}: MasterHeadDevTapZoneProps) {
  const countRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    countRef.current += 1;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (countRef.current >= REQUIRED_TAPS) {
      countRef.current = 0;
      onTripleTap();
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      countRef.current = 0;
      resetTimerRef.current = null;
    }, TAP_WINDOW_MS);
  }, [onTripleTap]);

  if (!enabled || !isDevShortcutEnabled()) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="マスター"
      onClick={handleTap}
      className="absolute left-[38%] top-[14%] z-[45] h-[16%] w-[24%] [-webkit-tap-highlight-color:transparent]"
    />
  );
}
