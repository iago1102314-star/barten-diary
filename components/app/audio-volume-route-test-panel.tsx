"use client";

import {
  AUDIO_VOLUME_ROUTE_TEST_LEVELS,
  getAudioVolumeRouteTestApi,
  isAudioVolumeRouteTestEnabled,
  type AudioVolumeRouteTestTarget,
} from "@/lib/entrance/audio-volume-route-test";
import { primeBarAudioForRouteTest } from "@/lib/entrance/bar-audio-engine";
import { useCallback, useEffect, useState } from "react";

const TARGETS: AudioVolumeRouteTestTarget[] = [
  "click",
  "door",
  "glassSlide",
  "jazzCounter",
];

export function AudioVolumeRouteTestPanel() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<AudioVolumeRouteTestTarget>("click");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const withUserGesture = useCallback(
    (run: () => Promise<void>) => {
      if (running) return;
      primeBarAudioForRouteTest();
      const api = getAudioVolumeRouteTestApi();
      if (!api) {
        console.warn("[audio-vol-test] API not installed — tap app once first");
        return;
      }
      setRunning(true);
      void run().finally(() => {
        setRunning(false);
      });
    },
    [running],
  );

  if (!mounted || !isAudioVolumeRouteTestEnabled()) {
    return null;
  }

  return (
    <div
      className="fixed bottom-3 right-3 z-[2147483645] max-w-[min(100vw-1.5rem,20rem)] font-sans text-[11px] leading-snug text-stone-100"
      data-audio-route-test-panel
    >
      {open ? (
        <div className="rounded-lg border border-amber-700/60 bg-stone-950/92 p-3 shadow-lg backdrop-blur-sm">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-medium tracking-wide text-amber-200/90">
              Audio Test
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

          <p className="mb-2 text-stone-500">
            iOS はタップ内で再生。連続 sweep は 2 音目以降失敗しうるので、下の
            単発ボタンも使う。
          </p>

          <div className="mb-3 flex flex-wrap gap-1">
            {TARGETS.map((item) => (
              <button
                key={item}
                type="button"
                disabled={running}
                className={`rounded px-2 py-1 ${
                  target === item
                    ? "bg-amber-900/80 text-amber-100"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                }`}
                onClick={() => setTarget(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mb-3 space-y-1">
            <button
              type="button"
              disabled={running}
              className="w-full rounded bg-stone-800 px-2 py-1.5 text-left text-stone-200 hover:bg-stone-700 disabled:opacity-50"
              onClick={() => {
                withUserGesture(async () => {
                  const api = getAudioVolumeRouteTestApi();
                  await api?.playVolumeSweep(target);
                });
              }}
            >
              Full sweep (element → webAudio)
            </button>
            <button
              type="button"
              disabled={running}
              className="w-full rounded bg-stone-800 px-2 py-1.5 text-left text-stone-200 hover:bg-stone-700 disabled:opacity-50"
              onClick={() => {
                withUserGesture(async () => {
                  const api = getAudioVolumeRouteTestApi();
                  await api?.playElementVolumeSweep(target);
                });
              }}
            >
              Element sweep only
            </button>
            <button
              type="button"
              disabled={running}
              className="w-full rounded bg-stone-800 px-2 py-1.5 text-left text-stone-200 hover:bg-stone-700 disabled:opacity-50"
              onClick={() => {
                withUserGesture(async () => {
                  const api = getAudioVolumeRouteTestApi();
                  await api?.playWebAudioVolumeSweep(target);
                });
              }}
            >
              WebAudio sweep only
            </button>
          </div>

          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-stone-500">
            Element (1 tap = 1 level)
          </p>
          <div className="mb-2 grid grid-cols-4 gap-1">
            {AUDIO_VOLUME_ROUTE_TEST_LEVELS.map((level) => (
              <button
                key={`e-${level}`}
                type="button"
                disabled={running}
                className="rounded bg-stone-800 px-1 py-1 text-[10px] text-stone-300 hover:bg-stone-700 disabled:opacity-50"
                onClick={() => {
                  withUserGesture(async () => {
                    const api = getAudioVolumeRouteTestApi();
                    await api?.playElementStep(target, level);
                  });
                }}
              >
                {level}
              </button>
            ))}
          </div>

          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-stone-500">
            WebAudio gain
          </p>
          <div className="grid grid-cols-4 gap-1">
            {AUDIO_VOLUME_ROUTE_TEST_LEVELS.map((level) => (
              <button
                key={`w-${level}`}
                type="button"
                disabled={running}
                className="rounded bg-stone-800 px-1 py-1 text-[10px] text-stone-300 hover:bg-stone-700 disabled:opacity-50"
                onClick={() => {
                  withUserGesture(async () => {
                    const api = getAudioVolumeRouteTestApi();
                    await api?.playWebAudioStep(target, level);
                  });
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="rounded-full border border-amber-700/50 bg-stone-950/90 px-3 py-1.5 text-[11px] font-medium text-amber-200/90 shadow-lg backdrop-blur-sm"
          onClick={() => setOpen(true)}
        >
          Audio Test
        </button>
      )}
    </div>
  );
}
