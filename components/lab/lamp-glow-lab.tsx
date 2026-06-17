"use client";

import { CounterScene } from "@/components/entrance/counter-scene";
import { SceneFrame } from "@/components/entrance/scene-frame";
import type { CameraPose } from "@/lib/entrance/counter-camera-poses";
import {
  COUNTER_LAMP_GLOWS,
  type CounterLampGlowConfig,
} from "@/lib/entrance/counter-lamp-glows";
import { formatLampGlowsForCopy } from "@/lib/entrance/lamp-glow-format";
import { LAMP_GLOW_INTENSITY_MAX } from "@/lib/entrance/lamp-glow-visual";
import { useCallback, useMemo, useState } from "react";

function cloneGlows(glows: CounterLampGlowConfig[]): CounterLampGlowConfig[] {
  return glows.map((glow) => ({ ...glow }));
}

type GlowField = keyof Pick<
  CounterLampGlowConfig,
  "offsetX" | "offsetY" | "size" | "ratio" | "intensity"
>;

const NUMERIC_FIELDS: { key: GlowField; label: string; step: number; hint?: string }[] = [
  { key: "offsetX", label: "offsetX (%)", step: 1, hint: "親要素内の横位置" },
  { key: "offsetY", label: "offsetY (%)", step: 1, hint: "親要素内の縦位置" },
  { key: "size", label: "size (%)", step: 1, hint: "親幅に対するグロー幅" },
  { key: "ratio", label: "ratio", step: 0.01, hint: "1=円、小=縦長" },
  { key: "intensity", label: "intensity", step: 0.05, hint: `光の強度 0〜${LAMP_GLOW_INTENSITY_MAX}` },
];

export function LampGlowLab() {
  const [glows, setGlows] = useState(() => cloneGlows(COUNTER_LAMP_GLOWS));
  const [selectedId, setSelectedId] = useState(COUNTER_LAMP_GLOWS[0].id);
  const [cameraPose, setCameraPose] = useState<CameraPose>("neutral");
  const [copied, setCopied] = useState(false);

  const selected = useMemo(
    () => glows.find((glow) => glow.id === selectedId) ?? glows[0],
    [glows, selectedId],
  );

  const updateGlow = useCallback(
    (id: string, patch: Partial<CounterLampGlowConfig>) => {
      setGlows((prev) =>
        prev.map((glow) => (glow.id === id ? { ...glow, ...patch } : glow)),
      );
    },
    [],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatLampGlowsForCopy(glows));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGlows(cloneGlows(COUNTER_LAMP_GLOWS));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr]">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-stone-500">
          左の数値を変えると右の赤点が動きます。位置が合ったら「設定をコピー」→{" "}
          <code className="text-stone-400">lib/entrance/counter-lamp-glows.ts</code>
          に貼り付けて保存してください。
        </p>

        <div className="flex gap-2">
          {(["neutral", "pondering"] as const).map((pose) => (
            <button
              key={pose}
              type="button"
              onClick={() => setCameraPose(pose)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                cameraPose === pose
                  ? "border-amber-700/60 text-amber-200"
                  : "border-stone-800 text-stone-500 hover:border-stone-600"
              }`}
            >
              {pose === "neutral" ? "正面（neutral）" : "気分選択（pondering）"}
            </button>
          ))}
        </div>

        {glows.map((glow) => (
          <section
            key={glow.id}
            className={`rounded-xl border p-4 transition-colors ${
              glow.id === selectedId
                ? "border-amber-700/50 bg-stone-950/80"
                : "border-stone-800/60 bg-stone-950/40"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedId(glow.id)}
              className="mb-1 text-left text-sm font-medium text-stone-300"
            >
              {glow.label}
            </button>
            <p className="mb-3 font-mono text-[11px] text-stone-600">
              anchor: {glow.anchor}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {NUMERIC_FIELDS.map(({ key, label, step, hint }) => (
                <label key={key} className="space-y-1 text-xs text-stone-500">
                  {label}
                  {hint && (
                    <span className="block text-[10px] text-stone-600">{hint}</span>
                  )}
                  <input
                    type="number"
                    step={step}
                    value={glow[key]}
                    onFocus={() => setSelectedId(glow.id)}
                    onChange={(event) =>
                      updateGlow(glow.id, {
                        [key]: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-md border border-stone-800 bg-stone-950 px-2 py-1.5 font-mono text-sm text-stone-200"
                  />
                </label>
              ))}
              <label className="col-span-2 space-y-1 text-xs text-stone-500">
                speed（明滅周期）
                <input
                  type="text"
                  value={glow.speed}
                  onFocus={() => setSelectedId(glow.id)}
                  onChange={(event) =>
                    updateGlow(glow.id, { speed: event.target.value })
                  }
                  className="w-full rounded-md border border-stone-800 bg-stone-950 px-2 py-1.5 font-mono text-sm text-stone-200"
                />
              </label>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-stone-700 px-4 py-2 text-sm text-stone-300 transition-colors hover:border-stone-500"
          >
            {copied ? "コピーしました" : "設定をコピー"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-stone-800 px-4 py-2 text-sm text-stone-500 transition-colors hover:border-stone-600 hover:text-stone-300"
          >
            初期値に戻す
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-stone-500">
          プレビュー — {cameraPose} / 選択中: {selected.label}
        </p>
        <div className="stage-viewport rounded-xl border border-stone-800 bg-black">
          <SceneFrame>
            <CounterScene
              priority
              settle={false}
              reduceGpuLoad={false}
              cameraPose={cameraPose}
              lampGlows={glows}
              showLampGlowLight
            />
          </SceneFrame>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-800/80">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="border-b border-stone-800 text-stone-500">
              <tr>
                <th className="px-3 py-2 font-normal">光源</th>
                <th className="px-3 py-2 font-normal">offsetX</th>
                <th className="px-3 py-2 font-normal">offsetY</th>
                <th className="px-3 py-2 font-normal">size</th>
                <th className="px-3 py-2 font-normal">ratio</th>
                <th className="px-3 py-2 font-normal">intensity</th>
                <th className="px-3 py-2 font-normal">speed</th>
              </tr>
            </thead>
            <tbody className="font-mono text-stone-300">
              {glows.map((glow) => (
                <tr
                  key={glow.id}
                  className={`border-b border-stone-900/80 ${
                    glow.id === selectedId ? "bg-stone-900/50" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-stone-400">{glow.label}</td>
                  <td className="px-3 py-2">{glow.offsetX}</td>
                  <td className="px-3 py-2">{glow.offsetY}</td>
                  <td className="px-3 py-2">{glow.size}</td>
                  <td className="px-3 py-2">{glow.ratio}</td>
                  <td className="px-3 py-2">{glow.intensity}</td>
                  <td className="px-3 py-2">{glow.speed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
