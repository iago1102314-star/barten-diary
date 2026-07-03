"use client";

import { isDevShortcutEnabled } from "@/lib/dev/is-dev-shortcut-enabled";

type DevPostRecordSkipButtonProps = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  hint?: string | null;
};

/** DEV — 店内シーン左上。録音〜別れまでを飛ばして postRecordThanks へ */
export function DevPostRecordSkipButton({
  onClick,
  loading = false,
  disabled = false,
  hint = null,
}: DevPostRecordSkipButtonProps) {
  if (!isDevShortcutEnabled()) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex max-w-[min(72vw,16rem)] flex-col gap-1">
      <button
        type="button"
        aria-label="開発用: 別れシーンへスキップ"
        disabled={disabled || loading}
        onClick={onClick}
        className="pointer-events-auto rounded border border-stone-600/30 bg-black/35 px-2 py-1 font-mono text-[10px] tracking-[0.06em] text-stone-400/75 backdrop-blur-sm transition-opacity disabled:opacity-40 [-webkit-tap-highlight-color:transparent] hover:text-stone-300/90"
      >
        {loading ? "…" : "DEV → 別れ"}
      </button>
      {hint ? (
        <p className="pointer-events-none rounded bg-black/50 px-2 py-1 font-mono text-[9px] leading-snug text-amber-200/80 backdrop-blur-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
