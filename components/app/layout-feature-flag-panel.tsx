"use client";

import {
  clearLayoutFeatureFlagStorage,
  isLayoutFeatureFlagPanelEnabled,
  readLayoutFeatureFlags,
  setLayoutFeatureFlag,
  type LayoutFeatureFlagId,
} from "@/lib/layout/layout-feature-flags";
import { useCallback, useState } from "react";

function notifyLayoutFlagsChanged() {
  window.dispatchEvent(new Event("barten-layout-flags-change"));
}

export function LayoutFeatureFlagPanel() {
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState(readLayoutFeatureFlags);

  const applyAndReload = useCallback(
    (next: { appShell: boolean; iosSafariHeight: boolean }) => {
      setLayoutFeatureFlag("appShell", next.appShell);
      setLayoutFeatureFlag("iosSafariHeight", next.iosSafariHeight);
      window.location.reload();
    },
    [],
  );

  const toggle = useCallback(
    (flag: LayoutFeatureFlagId) => {
      const current = readLayoutFeatureFlags();
      const next =
        flag === "appShell"
          ? { ...current, appShell: !current.appShell }
          : { ...current, iosSafariHeight: !current.iosSafariHeight };
      applyAndReload(next);
    },
    [applyAndReload],
  );

  const reset = useCallback(() => {
    clearLayoutFeatureFlagStorage("appShell");
    clearLayoutFeatureFlagStorage("iosSafariHeight");
    window.location.reload();
  }, []);

  if (!isLayoutFeatureFlagPanelEnabled()) {
    return null;
  }

  return (
    <div
      className="fixed bottom-3 left-3 z-[2147483646] max-w-[min(100vw-1.5rem,20rem)] font-sans text-[11px] leading-snug text-stone-100"
      data-layout-bisect-panel
    >
      {open ? (
        <div className="rounded-lg border border-stone-600/80 bg-stone-950/92 p-3 shadow-lg backdrop-blur-sm">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-medium tracking-wide text-stone-300">
              Layout bisect (dev)
            </p>
            <button
              type="button"
              className="shrink-0 rounded px-1.5 py-0.5 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
              onClick={() => setOpen(false)}
              aria-label="パネルを閉じる"
            >
              ×
            </button>
          </div>

          <p className="mb-3 text-stone-500">
            切り替え後に再読み込みします。URL:{" "}
            <code className="text-stone-400">?layoutShell=off</code> /{" "}
            <code className="text-stone-400">?layoutIosHeight=off</code>
          </p>

          <div className="space-y-2">
            <FlagRow
              label="App shell（PC枠 + portal-root）"
              enabled={flags.appShell}
              onToggle={() => toggle("appShell")}
            />
            <FlagRow
              label="iOS Safari height 補正"
              enabled={flags.iosSafariHeight}
              onToggle={() => toggle("iosSafariHeight")}
            />
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded border border-stone-700 px-2 py-1.5 text-stone-400 hover:border-stone-500 hover:text-stone-200"
            onClick={reset}
          >
            保存設定をクリアして既定に戻す
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="rounded-full border border-stone-600/70 bg-stone-950/85 px-3 py-1.5 text-stone-400 shadow-md backdrop-blur-sm hover:border-stone-500 hover:text-stone-200"
          onClick={() => {
            setFlags(readLayoutFeatureFlags());
            setOpen(true);
          }}
        >
          Layout bisect
        </button>
      )}
    </div>
  );
}

function FlagRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-stone-800 bg-stone-900/60 px-2 py-1.5">
      <span className="text-stone-300">{label}</span>
      <button
        type="button"
        className={[
          "shrink-0 rounded px-2 py-0.5 font-medium tabular-nums",
          enabled
            ? "bg-emerald-900/50 text-emerald-300"
            : "bg-amber-900/50 text-amber-300",
        ].join(" ")}
        onClick={onToggle}
      >
        {enabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}
