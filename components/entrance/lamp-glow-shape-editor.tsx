"use client";

import {
  LAMP_GLOW_TONES,
  type LampGlowConfigBase,
  type LampGlowShapeFields,
  type LampGlowTone,
} from "@/lib/entrance/lamp-glow-types";
import { LAMP_GLOW_INTENSITY_MAX } from "@/lib/entrance/lamp-glow-visual";
import { useState } from "react";

type ShapeField = keyof LampGlowShapeFields;

type LampGlowCopyActionsProps<T> = {
  glows: T[];
  targetFile: string;
  onCopySave: (glows: T[]) => void;
  onClearOverrides: () => void;
  formatForCopy: (glows: T[]) => string;
};

export function LampGlowCopyActions<T>({
  glows,
  targetFile,
  onCopySave,
  onClearOverrides,
  formatForCopy,
}: LampGlowCopyActionsProps<T>) {
  const [copied, setCopied] = useState(false);
  const [committed, setCommitted] = useState(false);

  const handleCopy = async () => {
    onCopySave(glows);
    await navigator.clipboard.writeText(formatForCopy(glows));
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  const handleCommittedToFile = () => {
    onClearOverrides();
    setCommitted(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="flex max-w-lg flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-md border border-amber-700/60 bg-black/80 px-3 py-1.5 font-mono text-[10px] text-amber-100"
        >
          {copied ? "コピー済 — TS に貼って！" : "① クリップボードにコピー"}
        </button>
        <button
          type="button"
          onClick={handleCommittedToFile}
          className="rounded-md border border-emerald-800/80 bg-black/80 px-3 py-1.5 font-mono text-[10px] text-emerald-300"
        >
          {committed ? "ファイル優先に戻します…" : "② TS に貼った → 反映"}
        </button>
      </div>
      <p className="max-w-md text-center font-mono text-[9px] leading-relaxed text-stone-500">
        コピーだけでは TS は変わりません。①でコピー →{" "}
        <code className="text-stone-400">{targetFile}</code> に貼り付け → ②を押す
      </p>
    </div>
  );
}

type LampGlowShapeEditorProps<T extends LampGlowConfigBase> = {
  glows: T[];
  fileGlows: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<LampGlowShapeFields>) => void;
  targetFile: string;
  targetConstant: string;
  onCopySave: (glows: T[]) => void;
  onClearOverrides: () => void;
  formatForCopy: (glows: T[]) => string;
};

const FIELDS: {
  key: ShapeField;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}[] = [
  { key: "size", label: "size", min: 1, max: 300, step: 1, hint: "親幅に対する %" },
  { key: "ratio", label: "ratio", min: 0.05, max: 3, step: 0.01, hint: "1=円" },
  {
    key: "intensity",
    label: "intensity",
    min: 0,
    max: LAMP_GLOW_INTENSITY_MAX,
    step: 0.05,
    hint: "0〜3（1超で強調）",
  },
];

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

export function LampGlowShapeEditor<T extends LampGlowConfigBase>({
  glows,
  fileGlows,
  selectedId,
  onSelect,
  onPatch,
  targetFile,
  targetConstant,
  onCopySave,
  onClearOverrides,
  formatForCopy,
}: LampGlowShapeEditorProps<T>) {
  const [panelHidden, setPanelHidden] = useState(false);
  const selected = glows.find((glow) => glow.id === selectedId) ?? glows[0];
  const fileGlow = fileGlows.find((glow) => glow.id === selectedId);
  if (!selected) return null;

  const setField = (key: ShapeField, raw: string) => {
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value)) return;

    const field = FIELDS.find((item) => item.key === key);
    if (!field) return;

    const clamped = Math.max(field.min, Math.min(field.max, value));
    onPatch(selected.id, { [key]: clamped });
  };

  if (panelHidden) {
    return (
      <div className="pointer-events-auto absolute inset-x-0 bottom-[4%] z-[70] flex justify-center px-3">
        <button
          type="button"
          onClick={() => setPanelHidden(false)}
          className="rounded-full border border-stone-600/80 bg-black/85 px-4 py-2 font-mono text-[11px] text-stone-300 backdrop-blur-sm hover:border-stone-400"
        >
          光の調整UIを表示
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
          確定値は <code className="text-stone-400">{targetFile}</code> の{" "}
          {targetConstant} — 位置 X {fileGlow.offsetX} / Y {fileGlow.offsetY}
        </p>
      )}

      <div className="w-full max-w-md space-y-2 rounded-lg border border-stone-700/80 bg-black/85 px-3 py-2.5 font-mono text-[11px] text-stone-300 backdrop-blur-sm">
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

        {FIELDS.map(({ key, label, min, max, step, hint }) => (
          <label key={key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-stone-500">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={selected[key]}
              onChange={(event) => setField(key, event.target.value)}
              className="min-w-0 flex-1 accent-amber-500"
            />
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={selected[key]}
              onChange={(event) => setField(key, event.target.value)}
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
        targetFile={targetFile}
        onCopySave={onCopySave}
        onClearOverrides={onClearOverrides}
        formatForCopy={formatForCopy}
      />
    </div>
  );
}
