"use client";

import {
  LAMP_GLOW_TONES,
  type LampGlowTone,
} from "@/lib/entrance/lamp-glow-types";
import type { EntryScreenPhase } from "@/components/entrance/night-entry-screen";
import { LAMP_GLOW_INTENSITY_MAX } from "@/lib/entrance/lamp-glow-visual";
import {
  clearStartBokehOnlyLampGlowOverrides,
  saveStartBokehOnlyLampGlowOverrides,
} from "@/lib/entrance/start-bokeh-only-lamp-glow-dev-overrides";
import { formatStartBokehOnlyLampGlowsForCopy } from "@/lib/entrance/lamp-glow-format";
import {
  START_BOKEH_BACKGROUND_OPACITY,
  START_BOKEH_ONLY_LAMP_GLOWS,
  type StartBokehLampGlowConfig,
  type StartBokehLampGlowShapeFields,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import { LampGlowCopyActions } from "@/components/entrance/lamp-glow-shape-editor";
import { useState, type ReactNode } from "react";

type StartBokehOnlyLampGlowShapeEditorProps = {
  glows: StartBokehLampGlowConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<StartBokehLampGlowShapeFields>) => void;
  currentPhase: EntryScreenPhase;
  backgroundOpacity: number;
  onBackgroundOpacityChange: (value: number) => void;
  groupTabs?: ReactNode;
};

const SHAPE_FIELDS = [
  { key: "size" as const, label: "size", min: 1, max: 300, step: 1, hint: "親幅に対する %" },
  { key: "ratio" as const, label: "ratio", min: 0.05, max: 3, step: 0.01, hint: "1=円" },
  {
    key: "intensity" as const,
    label: "intensity",
    min: 0,
    max: LAMP_GLOW_INTENSITY_MAX,
    step: 0.05,
    hint: "0〜3",
  },
];

const PHASE_LABELS: Record<EntryScreenPhase, string> = {
  bokeh: "読み込み直後（bokeh）",
  revealing: "移行中（revealing）",
  normal: "定常（normal）",
};

const TONE_LABELS: Record<LampGlowTone, string> = {
  warm: "暖 warm",
  cold: "冷 cold",
  neon: "ネオン neon",
};

const TONE_ACTIVE_CLASS: Record<LampGlowTone, string> = {
  warm: "border-amber-400/80 bg-amber-950/80 text-amber-100",
  cold: "border-sky-400/80 bg-sky-950/80 text-sky-100",
  neon: "border-cyan-400/80 bg-cyan-950/80 text-cyan-100",
};

/** ボケ専用光 15 点 — 定常には存在しない光の調整 */
export function StartBokehOnlyLampGlowShapeEditor({
  glows,
  selectedId,
  onSelect,
  onPatch,
  currentPhase,
  backgroundOpacity,
  onBackgroundOpacityChange,
  groupTabs,
}: StartBokehOnlyLampGlowShapeEditorProps) {
  const [panelHidden, setPanelHidden] = useState(false);
  const selected = glows.find((glow) => glow.id === selectedId) ?? glows[0];
  const fileGlow = START_BOKEH_ONLY_LAMP_GLOWS.find((glow) => glow.id === selectedId);
  if (!selected) return null;

  const setField = (
    key: keyof StartBokehLampGlowShapeFields,
    raw: string,
    min: number,
    max: number,
  ) => {
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value)) return;
    onPatch(selected.id, { [key]: Math.max(min, Math.min(max, value)) });
  };

  if (panelHidden) {
    return (
      <div className="pointer-events-auto absolute inset-x-0 bottom-[4%] z-[70] flex justify-center px-3">
        <button
          type="button"
          onClick={() => setPanelHidden(false)}
          className="rounded-full border border-stone-600/80 bg-black/85 px-4 py-2 font-mono text-[11px] text-stone-300 backdrop-blur-sm hover:border-stone-400"
        >
          UIを表示
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-[4%] z-[70] flex flex-col items-center gap-2 px-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPanelHidden(true)}
          className="rounded-full border border-stone-700/80 bg-black/70 px-3 py-1 font-mono text-[10px] text-stone-400 hover:border-stone-500"
        >
          調整UIを一時非表示
        </button>
      </div>

      {groupTabs}

      <p className="font-mono text-[9px] text-stone-500">
        現在の状態:{" "}
        <span className="text-stone-300">{PHASE_LABELS[currentPhase]}</span>
      </p>

      <p className="font-mono text-[9px] text-stone-500">
        ボケ専用光（白4 / 橙9 / ネオン2）— 確定値は{" "}
        <code className="text-stone-400">START_BOKEH_ONLY_LAMP_GLOWS</code>
      </p>

      <div className="flex max-w-full flex-wrap justify-center gap-1.5">
        {glows.map((glow) => (
          <button
            key={glow.id}
            type="button"
            onClick={() => onSelect(glow.id)}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${
              glow.id === selectedId
                ? "border-amber-400/80 bg-amber-950/80 text-amber-100"
                : "border-stone-700/80 bg-black/70 text-stone-400 hover:border-stone-500"
            }`}
          >
            {glow.label}
          </button>
        ))}
      </div>

      {fileGlow && (
        <p className="font-mono text-[9px] text-stone-500">
          ファイル確定値 — size {fileGlow.size} / intensity {fileGlow.intensity}
        </p>
      )}

      <div className="w-full max-w-md space-y-2 rounded-lg border border-stone-700/80 bg-black/85 px-3 py-2.5 font-mono text-[11px] text-stone-300 backdrop-blur-sm">
        <label className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-stone-500">背景</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={backgroundOpacity}
            onChange={(event) =>
              onBackgroundOpacityChange(Number.parseFloat(event.target.value))
            }
            className="min-w-0 flex-1 accent-amber-500"
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={backgroundOpacity}
            onChange={(event) =>
              onBackgroundOpacityChange(Number.parseFloat(event.target.value))
            }
            className="w-16 shrink-0 rounded border border-stone-700 bg-stone-950 px-1 py-0.5 text-center text-stone-200"
          />
          <span className="hidden w-28 shrink-0 text-[9px] text-stone-600 sm:inline">
            rain-alley opacity
          </span>
        </label>
        <p className="text-[9px] text-stone-600">
          確定値 → START_BOKEH_BACKGROUND_OPACITY（現在{" "}
          {START_BOKEH_BACKGROUND_OPACITY}）
        </p>

        <div className="space-y-1.5">
          <span className="text-stone-500">tone</span>
          <div className="flex flex-wrap gap-1.5">
            {LAMP_GLOW_TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => onPatch(selected.id, { tone })}
                className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                  selected.tone === tone
                    ? TONE_ACTIVE_CLASS[tone]
                    : "border-stone-700/80 bg-stone-950/80 text-stone-500 hover:border-stone-500"
                }`}
              >
                {TONE_LABELS[tone]}
              </button>
            ))}
          </div>
        </div>

        {SHAPE_FIELDS.map(({ key, label, min, max, step, hint }) => (
          <label key={key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-stone-500">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={selected[key]}
              onChange={(event) => setField(key, event.target.value, min, max)}
              className="min-w-0 flex-1 accent-amber-500"
            />
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={selected[key]}
              onChange={(event) => setField(key, event.target.value, min, max)}
              className="w-16 shrink-0 rounded border border-stone-700 bg-stone-950 px-1 py-0.5 text-center text-stone-200"
            />
            <span className="hidden w-20 shrink-0 text-[9px] text-stone-600 sm:inline">
              {hint}
            </span>
          </label>
        ))}
      </div>

      <LampGlowCopyActions
        glows={glows}
        targetFile="lib/entrance/start-bokeh-lamp-glows.ts"
        onCopySave={saveStartBokehOnlyLampGlowOverrides}
        onClearOverrides={clearStartBokehOnlyLampGlowOverrides}
        formatForCopy={formatStartBokehOnlyLampGlowsForCopy}
      />
    </div>
  );
}
