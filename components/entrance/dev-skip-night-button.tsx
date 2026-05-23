"use client";

import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";

type DevSkipNightButtonProps = {
  onSkip: () => void;
  disabled?: boolean;
};

export function DevSkipNightButton({
  onSkip,
  disabled = false,
}: DevSkipNightButtonProps) {
  if (!isDevShortcutEnabled()) return null;

  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className="mx-auto block text-[10px] tracking-wide text-stone-600/70 transition-colors hover:text-stone-500 disabled:opacity-40"
    >
      DEV: Skip Night
    </button>
  );
}
