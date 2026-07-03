"use client";

import { useBarAudio } from "@/hooks/use-bar-audio";
import { getBarAudioDiagnostics } from "@/lib/entrance/bar-audio-engine";
import {
  clearAudioVolumeOverrides,
  getBgmMix,
  getSeMix,
  readAudioVolumeOverrides,
  saveAudioVolumeOverrides,
  type AudioVolumeOverrides,
  type BarSfxKind,
  type BgmMixKey,
} from "@/lib/entrance/audio-volume-tuning";
import { useCallback, useEffect, useState } from "react";

const BGM_SLIDERS: { key: BgmMixKey; label: string }[] = [
  { key: "jazzCounter", label: "店内ジャズ" },
  { key: "outsideAlley", label: "路地（入場）" },
  { key: "outsideLeaving", label: "路地（退店）" },
];

const SE_SLIDERS: { key: BarSfxKind; label: string }[] = [
  { key: "door", label: "扉" },
  { key: "click", label: "クリック" },
  { key: "glassSlide", label: "グラス" },
  { key: "send", label: "送信" },
];

function formatVol(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(4);
}

export function AudioVolumeTunePanel() {
  const audio = useBarAudio();
  const [draft, setDraft] = useState<AudioVolumeOverrides>(() =>
    readAudioVolumeOverrides(),
  );
  const [diag, setDiag] = useState<Record<string, unknown>>({});

  const refreshDiag = useCallback(() => {
    setDiag(getBarAudioDiagnostics());
  }, []);

  useEffect(() => {
    refreshDiag();
    const id = window.setInterval(refreshDiag, 500);
    return () => window.clearInterval(id);
  }, [refreshDiag]);

  const setBgmDraft = (key: BgmMixKey, value: number) => {
    setDraft((prev) => ({
      ...prev,
      bgm: { ...prev.bgm, [key]: value },
    }));
  };

  const setSeDraft = (key: BarSfxKind, value: number) => {
    setDraft((prev) => ({
      ...prev,
      se: { ...prev.se, [key]: value },
    }));
  };

  const apply = () => {
    saveAudioVolumeOverrides(draft);
    audio.reapplyTuningVolumes();
    refreshDiag();
  };

  const reset = () => {
    clearAudioVolumeOverrides();
    setDraft({});
    audio.reapplyTuningVolumes();
    refreshDiag();
  };

  const jazz = diag.jazz as Record<string, unknown> | null | undefined;

  return (
    <div
      className="pointer-events-auto fixed bottom-3 left-3 z-[9999] max-h-[70vh] w-[min(100vw-1.5rem,22rem)] overflow-y-auto rounded-lg border border-amber-900/40 bg-black/88 p-3 text-[11px] leading-relaxed text-amber-100/90 shadow-xl backdrop-blur-sm"
      aria-label="音量チューニングパネル"
    >
      <p className="mb-2 font-medium tracking-wide text-amber-200">
        音量チューニング（dev）
      </p>

      <div className="mb-3 space-y-1 rounded bg-amber-950/40 p-2 font-mono text-[10px]">
        <p>ジャズ mix: {formatVol(getBgmMix("jazzCounter"))}</p>
        <p>出力 target: {formatVol(jazz?.targetVolume as number)}</p>
        <p>出力 effective: {formatVol(jazz?.effectiveOutput as number)}</p>
        <p>WebAudio: {String(jazz?.usesWebAudio)}</p>
        <p>BGMスライダー: {formatVol(diag.userBgmMultiplier as number)}</p>
      </div>

      <div className="space-y-3">
        {BGM_SLIDERS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-amber-200/80">{label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={draft.bgm?.[key] ?? getBgmMix(key)}
              onChange={(e) => setBgmDraft(key, Number(e.target.value))}
              className="w-full"
            />
            <span className="font-mono text-[10px] text-amber-300/70">
              {(draft.bgm?.[key] ?? getBgmMix(key)).toFixed(4)}
            </span>
          </label>
        ))}

        {SE_SLIDERS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-amber-200/80">SE {label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={draft.se?.[key] ?? getSeMix(key)}
              onChange={(e) => setSeDraft(key, Number(e.target.value))}
              className="w-full"
            />
            <span className="font-mono text-[10px] text-amber-300/70">
              {(draft.se?.[key] ?? getSeMix(key)).toFixed(3)}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={apply}
          className="rounded bg-amber-800/80 px-2 py-1 text-amber-50 hover:bg-amber-700/80"
        >
          適用
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-amber-800/60 px-2 py-1 hover:bg-amber-950/60"
        >
          リセット
        </button>
        <button
          type="button"
          onClick={() => audio.playClick()}
          className="rounded border border-amber-800/60 px-2 py-1 hover:bg-amber-950/60"
        >
          SE試聴
        </button>
      </div>
    </div>
  );
}
