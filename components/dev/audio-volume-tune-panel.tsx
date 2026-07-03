"use client";

import { useBarAudio } from "@/hooks/use-bar-audio";
import { getBarAudioDiagnostics } from "@/lib/entrance/bar-audio-engine";
import {
  clearAudioVolumeOverrides,
  copyAudioVolumeTuningSnippet,
  formatAudioVolumeTuningSnippet,
  getEffectiveMixSnapshot,
  readAudioVolumeOverrides,
  resolveBgmMix,
  resolveSeMix,
  saveAudioVolumeOverrides,
  type AudioVolumeOverrides,
  type BarSfxKind,
  type BgmMixKey,
} from "@/lib/entrance/audio-volume-tuning";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

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

function dismissAudioTuneQueryParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("audioTune")) return;
  url.searchParams.delete("audioTune");
  window.history.replaceState({}, "", url);
}

export function AudioVolumeTunePanel() {
  const audio = useBarAudio();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AudioVolumeOverrides>(() =>
    readAudioVolumeOverrides(),
  );
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [diag, setDiag] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshDiag = useCallback(() => {
    setDiag(getBarAudioDiagnostics());
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshDiag();
    const id = window.setInterval(refreshDiag, 800);
    return () => window.clearInterval(id);
  }, [open, refreshDiag]);

  const setBgmDraft = (key: BgmMixKey, value: number) => {
    setCopyState("idle");
    setDraft((prev) => ({
      ...prev,
      bgm: { ...prev.bgm, [key]: value },
    }));
  };

  const setSeDraft = (key: BarSfxKind, value: number) => {
    setCopyState("idle");
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
    setCopyState("idle");
    audio.reapplyTuningVolumes();
    refreshDiag();
  };

  const copySnippet = async () => {
    const ok = await copyAudioVolumeTuningSnippet(draft);
    setCopyState(ok ? "ok" : "fail");
    if (ok) {
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const close = () => {
    setOpen(false);
    setHidden(true);
    dismissAudioTuneQueryParam();
  };

  if (!mounted || hidden) return null;

  const snapshot = getEffectiveMixSnapshot(draft);
  const snippet = formatAudioVolumeTuningSnippet(draft);
  const jazz = diag.jazz as Record<string, unknown> | null | undefined;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed right-3 top-3 rounded-full border border-amber-800/50 bg-black/75 px-2.5 py-1 text-[10px] tracking-wide text-amber-200/90 shadow-md"
          aria-label="音量チューニングを開く"
        >
          音量 dev
        </button>
      ) : (
        <div
          className="pointer-events-auto fixed right-3 top-3 flex max-h-[min(52vh,24rem)] w-[min(100vw-1.5rem,17rem)] flex-col overflow-hidden rounded-lg border border-amber-900/50 bg-black/92 text-[10px] leading-snug text-amber-100/90 shadow-xl"
          aria-label="音量チューニングパネル"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-amber-900/40 px-2 py-1.5">
            <p className="font-medium text-amber-200">音量 dev</p>
            <button
              type="button"
              onClick={close}
              className="rounded px-1.5 py-0.5 text-amber-300/80 hover:bg-amber-950/80"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <p className="mb-2 text-[9px] text-amber-300/70">
              ①適用 → ②コピー → audio-volume-tuning.ts の mix を書き換え → ③リセット
            </p>

            <div className="mb-2 space-y-0.5 rounded bg-amber-950/40 p-1.5 font-mono text-[9px]">
              <p>再生中 jazz: {String(jazz?.effectiveOutput ?? "—")}</p>
              <p>jazz mix: {snapshot.bgm.jazzCounter}</p>
            </div>

            <div className="space-y-2">
              {BGM_SLIDERS.map(({ key, label }) => (
                <label key={key} className="block">
                  <div className="flex justify-between text-amber-200/75">
                    <span>{label}</span>
                    <span className="font-mono text-[9px] text-amber-300/80">
                      {resolveBgmMix(key, draft)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.001}
                    value={resolveBgmMix(key, draft)}
                    onChange={(e) => setBgmDraft(key, Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              ))}

              {SE_SLIDERS.map(({ key, label }) => (
                <label key={key} className="block">
                  <div className="flex justify-between text-amber-200/75">
                    <span>SE {label}</span>
                    <span className="font-mono text-[9px] text-amber-300/80">
                      {resolveSeMix(key, draft)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={resolveSeMix(key, draft)}
                    onChange={(e) => setSeDraft(key, Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>

            <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap rounded bg-black/50 p-1.5 font-mono text-[8px] text-amber-200/70">
              {snippet}
            </pre>
          </div>

          <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-amber-900/40 p-2">
            <button
              type="button"
              onClick={apply}
              className="rounded bg-amber-800/80 px-2 py-0.5 text-amber-50"
            >
              適用
            </button>
            <button
              type="button"
              onClick={() => void copySnippet()}
              className="rounded border border-amber-600/70 bg-amber-950/50 px-2 py-0.5 text-amber-100"
            >
              {copyState === "ok"
                ? "コピー済"
                : copyState === "fail"
                  ? "失敗"
                  : "コピー"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded border border-amber-800/60 px-2 py-0.5"
            >
              リセット
            </button>
            <button
              type="button"
              onClick={() => audio.playClick()}
              className="rounded border border-amber-800/60 px-2 py-0.5"
            >
              SE
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
