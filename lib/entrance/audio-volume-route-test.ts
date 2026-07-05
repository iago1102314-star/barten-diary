/**
 * iOS Safari — HTMLAudioElement.volume vs Web Audio Gain の聴感切り分け（dev / local のみ）
 *
 * 通常再生・音量 tuning には影響しない。専用の一時 Audio 要素を使う。
 */

import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import { readPlatformAudioVolumeDebugInfo } from "@/lib/entrance/audio-volume-platform";

export const AUDIO_VOLUME_ROUTE_TEST_LEVELS = [1.0, 0.5, 0.1, 0.02] as const;

export type AudioVolumeRouteTestTarget =
  | "click"
  | "door"
  | "glassSlide"
  | "jazzCounter";

type AudioVolumeRouteTestDeps = {
  unlock: () => void;
  ensureContext: () => Promise<AudioContext | null>;
};

type SweepOptions = {
  levels?: readonly number[];
  gapMs?: number;
  elementOnly?: boolean;
  webAudioOnly?: boolean;
};

type RouteTestLog = {
  target: AudioVolumeRouteTestTarget;
  step: number;
  stepCount: number;
  route: "element" | "webAudio";
  requestedVolume: number;
  elementVolume: number | null;
  gain: number | null;
  muted: boolean | null;
  playOk: boolean;
  playError?: string;
  contextState?: string;
};

const TEST_SRC: Record<AudioVolumeRouteTestTarget, { src: string; loop: boolean }> =
  {
    click: { src: ENTRANCE_SOUNDS.click, loop: false },
    door: { src: ENTRANCE_SOUNDS.door, loop: false },
    glassSlide: { src: ENTRANCE_SOUNDS.glassSlide, loop: false },
    jazzCounter: { src: ENTRANCE_SOUNDS.jazz, loop: true },
  };

let routeTestApiInstalled = false;
let routeTestDeps: AudioVolumeRouteTestDeps | null = null;

export function isAudioVolumeRouteTestEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_AUDIO_ROUTE_TEST === "false") return false;
  if (process.env.NEXT_PUBLIC_AUDIO_ROUTE_TEST === "true") return true;
  if (process.env.NEXT_PUBLIC_AUDIO_VOLUME_DEBUG === "true") return true;
  if (process.env.NEXT_PUBLIC_AUDIO_VOLUME_DEBUG === "false") return false;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  return appEnv === "local" || appEnv === "dev";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function releaseTestAudio(audio: HTMLAudioElement) {
  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.src = "";
    audio.load();
  } catch {
    // ignore
  }
}

function logRouteTest(entry: RouteTestLog) {
  console.info("[audio-vol-test]", entry);
}

function normalizeTarget(
  target: string,
): AudioVolumeRouteTestTarget | null {
  if (target in TEST_SRC) {
    return target as AudioVolumeRouteTestTarget;
  }
  return null;
}

async function playElementVolumeStep(
  target: AudioVolumeRouteTestTarget,
  requestedVolume: number,
  step: number,
  stepCount: number,
  holdMs: number,
): Promise<void> {
  const { src, loop } = TEST_SRC[target];
  const audio = new Audio(src);
  audio.loop = loop;
  audio.muted = false;
  audio.volume = requestedVolume;
  audio.currentTime = 0;

  let playOk = false;
  let playError: string | undefined;

  try {
    await audio.play();
    playOk = true;
  } catch (error) {
    playOk = false;
    playError = error instanceof Error ? error.message : String(error);
  }

  logRouteTest({
    target,
    step,
    stepCount,
    route: "element",
    requestedVolume,
    elementVolume: audio.volume,
    gain: null,
    muted: audio.muted,
    playOk,
    playError,
  });

  await delay(holdMs);
  releaseTestAudio(audio);
}

async function playWebAudioVolumeStep(
  target: AudioVolumeRouteTestTarget,
  requestedVolume: number,
  step: number,
  stepCount: number,
  holdMs: number,
  ensureContext: () => Promise<AudioContext | null>,
): Promise<void> {
  const { src, loop } = TEST_SRC[target];
  const audio = new Audio(src);
  audio.loop = loop;
  audio.muted = false;
  audio.volume = 1;
  audio.currentTime = 0;

  const ctx = await ensureContext();
  if (!ctx) {
    logRouteTest({
      target,
      step,
      stepCount,
      route: "webAudio",
      requestedVolume,
      elementVolume: audio.volume,
      gain: null,
      muted: audio.muted,
      playOk: false,
      playError: "AudioContext unavailable",
    });
    releaseTestAudio(audio);
    return;
  }

  let source: MediaElementAudioSourceNode | null = null;
  let gain: GainNode | null = null;
  let playOk = false;
  let playError: string | undefined;

  try {
    source = ctx.createMediaElementSource(audio);
    gain = ctx.createGain();
    gain.gain.value = requestedVolume;
    source.connect(gain);
    gain.connect(ctx.destination);
    await audio.play();
    playOk = true;
  } catch (error) {
    playOk = false;
    playError = error instanceof Error ? error.message : String(error);
    try {
      source?.disconnect();
      gain?.disconnect();
    } catch {
      // ignore
    }
  }

  logRouteTest({
    target,
    step,
    stepCount,
    route: "webAudio",
    requestedVolume,
    elementVolume: audio.volume,
    gain: gain?.gain.value ?? null,
    muted: audio.muted,
    playOk,
    playError,
    contextState: ctx.state,
  });

  await delay(holdMs);
  try {
    source?.disconnect();
    gain?.disconnect();
  } catch {
    // ignore
  }
  releaseTestAudio(audio);
}

async function runVolumeSweep(
  deps: AudioVolumeRouteTestDeps,
  target: AudioVolumeRouteTestTarget,
  options: SweepOptions = {},
): Promise<void> {
  const levels = options.levels ?? AUDIO_VOLUME_ROUTE_TEST_LEVELS;
  const gapMs = options.gapMs ?? 900;
  const holdMs = target === "jazzCounter" ? 1500 : 900;
  const stepCount = levels.length;

  deps.unlock();

  console.info("[audio-vol-test] sweep:start", {
    target,
    levels: [...levels],
    gapMs,
    platform: readPlatformAudioVolumeDebugInfo(),
  });

  if (!options.webAudioOnly) {
    console.info("[audio-vol-test] sweep:route", { route: "element", target });
    for (let i = 0; i < levels.length; i += 1) {
      await playElementVolumeStep(target, levels[i]!, i + 1, stepCount, holdMs);
      if (i < levels.length - 1) {
        await delay(gapMs);
      }
    }
    if (!options.elementOnly) {
      await delay(gapMs);
    }
  }

  if (!options.elementOnly) {
    console.info("[audio-vol-test] sweep:route", { route: "webAudio", target });
    for (let i = 0; i < levels.length; i += 1) {
      await playWebAudioVolumeStep(
        target,
        levels[i]!,
        i + 1,
        stepCount,
        holdMs,
        deps.ensureContext,
      );
      if (i < levels.length - 1) {
        await delay(gapMs);
      }
    }
  }

  console.info("[audio-vol-test] sweep:done", { target });
}

async function runSingleElementStep(
  deps: AudioVolumeRouteTestDeps,
  target: AudioVolumeRouteTestTarget,
  volume: number,
): Promise<void> {
  deps.unlock();
  const holdMs = target === "jazzCounter" ? 1500 : 900;
  await playElementVolumeStep(target, volume, 1, 1, holdMs);
}

async function runSingleWebAudioStep(
  deps: AudioVolumeRouteTestDeps,
  target: AudioVolumeRouteTestTarget,
  volume: number,
): Promise<void> {
  deps.unlock();
  const holdMs = target === "jazzCounter" ? 1500 : 900;
  await playWebAudioVolumeStep(target, volume, 1, 1, holdMs, deps.ensureContext);
}

export type AudioVolumeRouteTestApi = {
  /** element → webAudio の順で 1.0 / 0.5 / 0.1 / 0.02 を再生 */
  playVolumeSweep: (
    target: AudioVolumeRouteTestTarget,
    options?: SweepOptions,
  ) => Promise<void>;
  /** element 音量のみ */
  playElementVolumeSweep: (
    target: AudioVolumeRouteTestTarget,
    options?: Omit<SweepOptions, "webAudioOnly" | "elementOnly">,
  ) => Promise<void>;
  /** Web Audio Gain のみ */
  playWebAudioVolumeSweep: (
    target: AudioVolumeRouteTestTarget,
    options?: Omit<SweepOptions, "webAudioOnly" | "elementOnly">,
  ) => Promise<void>;
  /** element 経路のみ（playVolumeSweep の別名） */
  playSfxVolumeTest: (
    target: AudioVolumeRouteTestTarget,
    options?: Omit<SweepOptions, "webAudioOnly" | "elementOnly">,
  ) => Promise<void>;
  /** click → door → glassSlide → jazzCounter */
  playAllVolumeSweeps: (options?: SweepOptions) => Promise<void>;
  /** 1 段だけ — タップごとにユーザー操作コンテキストを確保（iOS 向け） */
  playElementStep: (
    target: AudioVolumeRouteTestTarget,
    volume: number,
  ) => Promise<void>;
  playWebAudioStep: (
    target: AudioVolumeRouteTestTarget,
    volume: number,
  ) => Promise<void>;
  help: () => void;
};

export function getAudioVolumeRouteTestApi(): AudioVolumeRouteTestApi | null {
  if (typeof window === "undefined") return null;
  return (
    window as Window & { __bartenAudioTest?: AudioVolumeRouteTestApi }
  ).__bartenAudioTest ?? null;
}

export function installAudioVolumeRouteTestApi(
  deps: AudioVolumeRouteTestDeps,
): void {
  if (routeTestApiInstalled || typeof window === "undefined") return;
  if (!isAudioVolumeRouteTestEnabled()) return;

  routeTestApiInstalled = true;
  routeTestDeps = deps;

  const api: AudioVolumeRouteTestApi = {
    playVolumeSweep(target, options) {
      const normalized = normalizeTarget(target);
      if (!normalized) {
        console.warn("[audio-vol-test] unknown target:", target);
        return Promise.resolve();
      }
      return runVolumeSweep(deps, normalized, options);
    },
    playElementVolumeSweep(target, options) {
      const normalized = normalizeTarget(target);
      if (!normalized) {
        console.warn("[audio-vol-test] unknown target:", target);
        return Promise.resolve();
      }
      return runVolumeSweep(deps, normalized, {
        ...options,
        elementOnly: true,
      });
    },
    playWebAudioVolumeSweep(target, options) {
      const normalized = normalizeTarget(target);
      if (!normalized) {
        console.warn("[audio-vol-test] unknown target:", target);
        return Promise.resolve();
      }
      return runVolumeSweep(deps, normalized, {
        ...options,
        webAudioOnly: true,
      });
    },
    playSfxVolumeTest(target, options) {
      return api.playElementVolumeSweep(target, options);
    },
    async playAllVolumeSweeps(options) {
      const targets: AudioVolumeRouteTestTarget[] = [
        "click",
        "door",
        "glassSlide",
        "jazzCounter",
      ];
      for (const target of targets) {
        await runVolumeSweep(deps, target, options);
        await delay(options?.gapMs ?? 1200);
      }
      console.info("[audio-vol-test] all sweeps done");
    },
    playElementStep(target, volume) {
      const normalized = normalizeTarget(target);
      if (!normalized || routeTestDeps === null) {
        return Promise.resolve();
      }
      return runSingleElementStep(routeTestDeps, normalized, volume);
    },
    playWebAudioStep(target, volume) {
      const normalized = normalizeTarget(target);
      if (!normalized || routeTestDeps === null) {
        return Promise.resolve();
      }
      return runSingleWebAudioStep(routeTestDeps, normalized, volume);
    },
    help() {
      console.info(`[audio-vol-test] Usage (tap screen once before running):
  await __bartenAudioTest.playVolumeSweep("click")
  await __bartenAudioTest.playElementVolumeSweep("door")
  await __bartenAudioTest.playWebAudioVolumeSweep("glassSlide")
  await __bartenAudioTest.playAllVolumeSweeps()

Targets: click | door | glassSlide | jazzCounter
Levels: ${AUDIO_VOLUME_ROUTE_TEST_LEVELS.join(" → ")}
Logs: [audio-vol-test] route / requestedVolume / elementVolume / gain / playOk`);
    },
  };

  (
    window as Window & { __bartenAudioTest?: AudioVolumeRouteTestApi }
  ).__bartenAudioTest = api;

  console.info(
    "[audio-vol-test] installed — run __bartenAudioTest.help() after a user tap",
  );
}
