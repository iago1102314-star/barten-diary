"use client";

import {
  clearAllLayoutFeatureFlagStorage,
  readLayoutFeatureFlags,
  setLayoutFeatureFlag,
  type LayoutFeatureFlagId,
} from "@/lib/layout/layout-feature-flags";
import {
  clearAllPerfFeatureFlagStorage,
  isBisectFeatureFlagPanelEnabled,
  readPerfFeatureFlags,
  setPerfFeatureFlag,
  type PerfFeatureFlagId,
} from "@/lib/layout/perf-feature-flags";
import { useCallback, useState } from "react";

export function BisectFeatureFlagPanel() {
  const [open, setOpen] = useState(false);
  const [layoutFlags, setLayoutFlags] = useState(readLayoutFeatureFlags);
  const [perfFlags, setPerfFlags] = useState(readPerfFeatureFlags);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  const toggleLayout = useCallback(
    (flag: LayoutFeatureFlagId) => {
      const current = readLayoutFeatureFlags();
      setLayoutFeatureFlag(flag, !current[flag]);
      reload();
    },
    [reload],
  );

  const togglePerf = useCallback(
    (flag: PerfFeatureFlagId) => {
      const current = readPerfFeatureFlags();
      setPerfFeatureFlag(flag, !current[flag]);
      reload();
    },
    [reload],
  );

  const reset = useCallback(() => {
    clearAllLayoutFeatureFlagStorage();
    clearAllPerfFeatureFlagStorage();
    reload();
  }, [reload]);

  if (!isBisectFeatureFlagPanelEnabled()) {
    return null;
  }

  return (
    <div
      className="fixed bottom-3 left-3 z-[2147483646] max-h-[min(70dvh,32rem)] max-w-[min(100vw-1.5rem,22rem)] overflow-y-auto font-sans text-[11px] leading-snug text-stone-100"
      data-bisect-panel
    >
      {open ? (
        <div className="rounded-lg border border-stone-600/80 bg-stone-950/92 p-3 shadow-lg backdrop-blur-sm">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-medium tracking-wide text-stone-300">
              Bisect (dev)
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
            切り替え後に再読み込みします。例:{" "}
            <code className="text-stone-400">?perfAll=off</code> /{" "}
            <code className="text-stone-400">?layoutPortalOnly=off</code>
          </p>

          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-stone-500">
            Layout
          </p>
          <div className="mb-3 space-y-2">
            <FlagRow
              label="App shell（PC枠 + portal）"
              enabled={layoutFlags.appShell}
              onToggle={() => toggleLayout("appShell")}
            />
            <FlagRow
              label="Portal root のみ（shell 残す）"
              enabled={layoutFlags.portalOnly}
              disabled={!layoutFlags.appShell}
              onToggle={() => toggleLayout("portalOnly")}
            />
            <FlagRow
              label="iOS Safari height 補正"
              enabled={layoutFlags.iosSafariHeight}
              onToggle={() => toggleLayout("iosSafariHeight")}
            />
          </div>

          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-stone-500">
            Performance
          </p>
          <div className="space-y-2">
            <FlagRow
              label="perfAll（下記まとめて OFF）"
              enabled={perfFlags.all}
              onToggle={() => togglePerf("all")}
            />
            <FlagRow
              label="Menu backdrop（シーン複製）"
              enabled={perfFlags.menuBackdrop}
              onToggle={() => togglePerf("menuBackdrop")}
            />
            <FlagRow
              label="Menu blur"
              enabled={perfFlags.menuBlur}
              onToggle={() => togglePerf("menuBlur")}
            />
            <FlagRow
              label="Lamp breathe"
              enabled={perfFlags.lampBreathe}
              onToggle={() => togglePerf("lampBreathe")}
            />
            <FlagRow
              label="Grain"
              enabled={perfFlags.grain}
              onToggle={() => togglePerf("grain")}
            />
            <FlagRow
              label="Haze / fog-drift"
              enabled={perfFlags.haze}
              onToggle={() => togglePerf("haze")}
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
            setLayoutFlags(readLayoutFeatureFlags());
            setPerfFlags(readPerfFeatureFlags());
            setOpen(true);
          }}
        >
          Bisect
        </button>
      )}
    </div>
  );
}

function FlagRow({
  label,
  enabled,
  disabled = false,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-stone-800 bg-stone-900/60 px-2 py-1.5">
      <span className={disabled ? "text-stone-600" : "text-stone-300"}>
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        className={[
          "shrink-0 rounded px-2 py-0.5 font-medium tabular-nums",
          disabled
            ? "bg-stone-800/50 text-stone-600"
            : enabled
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

/** @deprecated BisectFeatureFlagPanel を使用 */
export const LayoutFeatureFlagPanel = BisectFeatureFlagPanel;
