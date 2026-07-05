import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import {
  getBgmVolumeMultiplier,
  getSeVolumeMultiplier,
} from "@/lib/settings/audio-preferences";
import {
  BAR_AUDIO_TIMING,
  ensureClientPlatformAudioMixReady,
  getBgmMix,
  getSeMix,
  getSfxPlayVolume,
  installAudioVolumeDevApi,
  logAudioVolumeDebug,
  logPlatformAudioMixReady,
  type BarSfxKind,
  type BgmMixKey,
} from "@/lib/entrance/audio-levels";
import {
  installIosSfxNetworkProofApi,
  queueIosSfxNetworkProof,
} from "@/lib/entrance/ios-sfx-network-proof";
import {
  isIosSfxResolvedSrc,
  isIosSfxTargetKind,
  logIosSfxSrcDebug,
  markIosSfxRuntimeFallback,
  readIosSfxResolveDebugInfo,
  resolveBarSfxSrc,
  resolveDefaultBarSfxSrc,
} from "@/lib/entrance/ios-sfx-assets";
import { IOS_SFX_CACHE_REVISION } from "@/lib/entrance/generated-ios-sfx-manifest";
import { logRecordingPipeline } from "@/lib/recorder/recording-pipeline-log";
import { isPerfAudioEnabled } from "@/lib/layout/perf-feature-flags";

/** 短い UI 音 — 重ね再生で潰れないよう再生前に同一プールを止める */
const MONOPHONIC_SFX_KINDS = new Set<BarSfxKind>(["click", "menuClick"]);

const BAR_SFX_KINDS: BarSfxKind[] = [
  "door",
  "click",
  "menuOpen",
  "menuClick",
  "glassSlide",
  "send",
  "page",
  "think",
];

const sfxPool = new Map<string, HTMLAudioElement[]>();
const sfxKindBySrc = new Map<string, BarSfxKind>();
let sfxPoolInitialized = false;
let sfxPoolCacheRevision: number | null = null;

let bgmPausedForRecording = false;
let appBackgroundSuspended = false;
let barAudioLifecycleAttached = false;
let warmUpPromise: Promise<void> | null = null;
let barAudioUserGestureUnlocked = false;
let barAudioContext: AudioContext | null = null;

function getBarAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;

  return (
    window.AudioContext ??
    (
      window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext ??
    null
  );
}

async function ensureBarAudioContext(): Promise<AudioContext | null> {
  const Ctx = getBarAudioContextClass();
  if (!Ctx) return null;

  if (!barAudioContext) {
    barAudioContext = new Ctx();
  }

  if (barAudioContext.state === "suspended") {
    try {
      await barAudioContext.resume();
    } catch {
      // ignore
    }
  }

  return barAudioContext;
}

function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/** ユーザー操作後 — バックグラウンド停止フラグを解除（BGM 再開は各シーン側で明示的に） */
function markBarAudioUserInteraction(): void {
  appBackgroundSuspended = false;
}

/**
 * SE / BGM 再生前 — unlock 済みでもプール破棄・context suspend から復旧する。
 * dispose() 後や visibility 中断後に「以降すべて鳴らない」を防ぐ。
 */
function recoverBarAudioOnUserGesture(): void {
  markBarAudioUserInteraction();

  if (!sfxPoolInitialized) {
    ensureSfxPool();
    if (barAudioUserGestureUnlocked) {
      void warmUpBarAudio();
    }
  }

  if (barAudioContext?.state === "suspended") {
    void barAudioContext.resume().catch(() => {});
  }
}

function pauseLoopTrackForAppBackground(track: LoopingTrackState) {
  const audio = track.audio;
  if (!audio || !track.started) return;

  cancelTrackFade(track);
  track.ambient?.pause();
  try {
    audio.pause();
  } catch {
    // ignore
  }
}

/**
 * ホーム画面・他アプリ・画面ロック — BGM を pause（SE は完走させる）。
 * フォアグラウンド復帰時の自動再開は行わない（visible でブロックだけ解除）。
 */
export function suspendBarAudioForAppBackground(): void {
  if (typeof document === "undefined") return;

  appBackgroundSuspended = true;
  outsidePreparePromise = null;
  jazzPreparePromise = null;

  pauseLoopTrackForAppBackground(outsideTrack);
  pauseLoopTrackForAppBackground(jazzTrack);

  if (
    barAudioContext?.state === "running" &&
    shouldRouteLoopTrackThroughWebAudio()
  ) {
    void barAudioContext.suspend();
  }
}

/**
 * iOS Safari / PWA — visibilitychange + pagehide（blur/focus は誤発火が多いため不使用）
 */
export function attachBarAudioAppLifecycle(): void {
  if (barAudioLifecycleAttached || typeof document === "undefined") return;
  barAudioLifecycleAttached = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      suspendBarAudioForAppBackground();
      return;
    }
    // 復帰 — ブロックだけ解除（BGM 自動再開はしない）
    appBackgroundSuspended = false;
  });

  window.addEventListener("pagehide", () => {
    suspendBarAudioForAppBackground();
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    appBackgroundSuspended = false;
    if (barAudioUserGestureUnlocked && !sfxPoolInitialized) {
      ensureSfxPool();
    }
  });
}

function isLoopTrackPlaying(track: LoopingTrackState): boolean {
  const audio = track.audio;
  if (!track.started || !audio || audio.paused) return false;
  return getTrackOutputLevel(audio, track) > 0.001;
}

function shouldBlockBackgroundBgmPlayback(): boolean {
  return appBackgroundSuspended || isDocumentHidden();
}

/** 扉を開ける / メモを見る等 — 最初の明確なユーザー操作後にのみ呼ぶ */
export function unlockBarAudioForUserGesture(): void {
  ensureAudioVolumeDevApi();

  const firstUnlock = !barAudioUserGestureUnlocked;
  if (firstUnlock) {
    barAudioUserGestureUnlocked = true;
    logPlatformAudioMixReady();
    prefetchLoopingSource(ENTRANCE_SOUNDS.jazz);
    prefetchLoopingSource(ENTRANCE_SOUNDS.outside);
    beginOutsideAlleyPreload();
    primeBarAudioUnlockOnFirstGesture();
    void warmUpBarAudio();
  }

  recoverBarAudioOnUserGesture();

  if (shouldRouteLoopTrackThroughWebAudio()) {
    void ensureBarAudioContext();
  }
}

function isBarAudioUnlocked(): boolean {
  return barAudioUserGestureUnlocked;
}

/** React 側の unlock 状態とモジュール状態のズレ確認（HMR 後など） */
export function isBarAudioUnlockedByClient(): boolean {
  return barAudioUserGestureUnlocked;
}

/** HMR でモジュールが再評価された後 — プールだけ復元（play は次のユーザー操作で） */
export function restoreBarAudioUnlockAfterModuleReload(): void {
  if (barAudioUserGestureUnlocked) return;
  barAudioUserGestureUnlocked = true;
  ensureSfxPool();
  prefetchLoopingSource(ENTRANCE_SOUNDS.outside);
  beginOutsideAlleyPreload();
  void ensureBarAudioContext();
  void warmUpBarAudio();
}

function createAudio(src: string, preload: "none" | "auto" = "none"): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    const audio = new Audio(src);
    audio.preload = preload;
    return audio;
  } catch {
    return null;
  }
}

function readAudioElementSrc(audio: HTMLAudioElement): string {
  try {
    return audio.currentSrc || audio.src || "";
  } catch {
    return "";
  }
}

function snapshotSfxPoolForDebug(): Array<Record<string, unknown>> {
  const entries: Array<Record<string, unknown>> = [];

  for (const [poolKey, slots] of sfxPool.entries()) {
    entries.push({
      poolKey,
      kind: sfxKindBySrc.get(poolKey) ?? null,
      slots: slots.map((audio, index) => ({
        index,
        elementSrc: readAudioElementSrc(audio),
        paused: audio.paused,
        readyState: audio.readyState,
        networkState: audio.networkState,
      })),
    });
  }

  return entries;
}

const loopPrefetch = new Map<string, HTMLAudioElement>();

function prefetchLoopingSource(src: string) {
  if (loopPrefetch.has(src)) return;
  const audio = createAudio(src, "auto");
  if (!audio) return;
  audio.load();
  loopPrefetch.set(src, audio);
}

async function safePlay(audio: HTMLAudioElement): Promise<boolean> {
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/** Web Audio 経路で play 拒否されたとき — 要素直結にフォールバック */
async function safePlayLoopTrack(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): Promise<boolean> {
  if (await safePlay(audio)) return true;

  if (track.webAudio) {
    disconnectTrackWebAudio(track);
    audio.muted = false;
    audio.volume = 0;
    return safePlay(audio);
  }

  return false;
}

function waitForCanPlay(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }

    const done = () => resolve();
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("loadeddata", done, { once: true });
    audio.addEventListener("error", done, { once: true });
  });
}

/** 曲を5分割し、そのうち1区間内のランダム位置から再生 */
function pickRandomStartTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 1) return 0;

  const segments = BAR_AUDIO_TIMING.randomStartSegments;
  const segmentIndex = Math.floor(Math.random() * segments);
  const segmentSize = duration / segments;
  const segmentStart = segmentSize * segmentIndex;
  const segmentEnd = segmentSize * (segmentIndex + 1);
  const margin = Math.min(0.5, segmentSize * 0.1);
  const max = Math.max(segmentStart, segmentEnd - margin);

  return segmentStart + Math.random() * (max - segmentStart);
}

function waitForMetadata(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve();
      return;
    }
    audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
    audio.addEventListener("error", () => resolve(), { once: true });
  });
}

type AmbientVolumeController = {
  pause: () => void;
  resume: () => void;
  applyNow: () => void;
  dispose: () => void;
};

type LoopWebAudioRouting = {
  source: MediaElementAudioSourceNode;
  gain: GainNode;
};

type LoopingTrackState = {
  audio: HTMLAudioElement | null;
  started: boolean;
  fade: number | null;
  /** iOS 要素フェード — rAF より setInterval の方が音量反映が安定 */
  fadeTimer: ReturnType<typeof setInterval> | null;
  /** Web Audio linearRamp 完了待ち */
  fadeCompleteTimer: number | null;
  targetVolume: number;
  ambient: AmbientVolumeController | null;
  webAudio: LoopWebAudioRouting | null;
  /** stop / 新規 start で進め、await 後の stale 再生を防ぐ */
  generation: number;
};

function createInitialTrackState(defaultVolume: number): LoopingTrackState {
  return {
    audio: null,
    started: false,
    fade: null,
    fadeTimer: null,
    fadeCompleteTimer: null,
    targetVolume: defaultVolume,
    ambient: null,
    webAudio: null,
    generation: 0,
  };
}

function disconnectTrackWebAudio(track: LoopingTrackState) {
  if (!track.webAudio) return;

  try {
    track.webAudio.source.disconnect();
    track.webAudio.gain.disconnect();
  } catch {
    // ignore
  }

  track.webAudio = null;
}

async function connectLoopTrackWebAudio(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): Promise<GainNode | null> {
  if (track.webAudio) return track.webAudio.gain;

  const ctx = await ensureBarAudioContext();
  if (!ctx) return null;

  try {
    audio.volume = 1;
    audio.muted = false;
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(ctx.destination);
    track.webAudio = { source, gain };
    return gain;
  } catch {
    return null;
  }
}

async function ensureTrackWebAudio(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): Promise<GainNode | null> {
  if (!shouldRouteLoopTrackThroughWebAudio()) return null;
  return connectLoopTrackWebAudio(audio, track);
}

/**
 * iOS ループ BGM（jazz / outside）— Web Audio Gain で音量制御。
 * 失敗時は呼び出し側が element interval フェードへフォールバックする。
 */
async function ensureIosLoopBgmWebAudio(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): Promise<boolean> {
  if (!isIosAudioSession()) return false;
  return (await connectLoopTrackWebAudio(audio, track)) !== null;
}

function setTrackOutputLevel(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
  level: number,
  debugLabel?: string,
) {
  const clamped = clampVolume(level);
  if (track.webAudio) {
    track.webAudio.gain.gain.value = clamped;
    if (debugLabel) {
      logAudioVolumeDebug(debugLabel, {
        path: "webAudio",
        gain: clamped,
        elementVolume: audio.volume,
      });
    }
    return;
  }
  audio.volume = clamped;
  if (debugLabel) {
    logAudioVolumeDebug(debugLabel, {
      path: "element",
      volume: clamped,
      muted: audio.muted,
    });
  }
}

function getTrackOutputLevel(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): number {
  if (track.webAudio) return track.webAudio.gain.gain.value;
  return audio.volume;
}

function releaseAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;

  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.src = "";
    audio.load();
  } catch {
    // 解放失敗は無視（既に detach 済み等）
  }
}

function isTrackAudioCurrent(
  track: LoopingTrackState,
  token: number,
  audio: HTMLAudioElement,
): boolean {
  return track.generation === token && track.audio === audio;
}

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

function easeInOut(t: number): number {
  const p = Math.max(0, Math.min(1, t));
  return p * p * (3 - 2 * p);
}

function computeBreathMultiplier(
  currentTime: number,
  duration: number,
): number {
  const { breathCyclesPerLoop, breathDepth } = BAR_AUDIO_TIMING.jazzAmbient;
  const period = duration / breathCyclesPerLoop;
  if (!Number.isFinite(period) || period <= 0) return 1;

  const wave = (1 - Math.cos((currentTime / period) * Math.PI * 2)) / 2;
  return 1 - breathDepth * wave;
}

function computeLoopMultiplier(
  currentTime: number,
  duration: number,
): number {
  const { loopFadeInSec, loopFadeOutSec, loopFloorRatio } =
    BAR_AUDIO_TIMING.jazzAmbient;

  if (currentTime < loopFadeInSec) {
    const progress = easeInOut(currentTime / loopFadeInSec);
    return loopFloorRatio + (1 - loopFloorRatio) * progress;
  }

  if (currentTime > duration - loopFadeOutSec) {
    const progress = easeInOut(
      (currentTime - (duration - loopFadeOutSec)) / loopFadeOutSec,
    );
    return 1 - (1 - loopFloorRatio) * progress;
  }

  return 1;
}

function computeJazzAmbientMultiplier(
  currentTime: number,
  duration: number,
): number {
  return (
    computeBreathMultiplier(currentTime, duration) *
    computeLoopMultiplier(currentTime, duration)
  );
}

function disposeAmbientController(track: LoopingTrackState) {
  track.ambient?.dispose();
  track.ambient = null;
}

function createNoopAmbientController(): AmbientVolumeController {
  return {
    pause: () => {},
    resume: () => {},
    applyNow: () => {},
    dispose: () => {},
  };
}

function createJazzAmbientModulation(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): AmbientVolumeController {
  if (!isPerfAudioEnabled()) {
    return createNoopAmbientController();
  }

  let paused = false;
  let rafId: number | null = null;

  const applyNow = () => {
    if (paused || isTrackFading(track) || audio.paused) return;

    const duration = audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const multiplier = computeJazzAmbientMultiplier(
      audio.currentTime,
      duration,
    );
    setTrackOutputLevel(
      audio,
      track,
      clampVolume(track.targetVolume * multiplier),
    );
  };

  const tick = () => {
    if (track.audio === audio) {
      applyNow();
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);

  return {
    pause: () => {
      paused = true;
    },
    resume: () => {
      paused = false;
      applyNow();
    },
    applyNow,
    dispose: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

function isTrackFading(track: LoopingTrackState): boolean {
  return (
    track.fade !== null ||
    track.fadeTimer !== null ||
    track.fadeCompleteTimer !== null
  );
}

function cancelTrackFade(track: LoopingTrackState) {
  if (track.fade !== null) {
    cancelAnimationFrame(track.fade);
    track.fade = null;
  }
  if (track.fadeTimer !== null) {
    clearInterval(track.fadeTimer);
    track.fadeTimer = null;
  }
  if (track.fadeCompleteTimer !== null) {
    clearTimeout(track.fadeCompleteTimer);
    track.fadeCompleteTimer = null;
  }
  if (track.webAudio) {
    try {
      const gainNode = track.webAudio.gain;
      gainNode.gain.cancelScheduledValues(gainNode.context.currentTime);
    } catch {
      // ignore
    }
  }
}

/** iOS Safari — play() 直前に無音化（Web Audio 優先） */
function primeLoopAudioSilence(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
) {
  if (track.webAudio) {
    track.webAudio.gain.gain.value = 0;
    audio.muted = false;
    audio.volume = 1;
    return;
  }

  audio.volume = 0;
  audio.muted = true;
}

function computeFadeLevel(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
  from: number,
  to: number,
  progress: number,
): number {
  // 入店フェード中は呼吸・ループ係数を掛けない（完了後に ambient が再開）
  if (to > 0 && from === 0) {
    return clampVolume(to * progress);
  }

  return from + (to - from) * progress;
}

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  track: LoopingTrackState,
  onComplete?: () => void,
) {
  cancelTrackFade(track);
  track.ambient?.pause();

  const fadeIn = to > 0 && from === 0;
  const usesWebAudio = track.webAudio !== null;
  const useIosIntervalFade =
    fadeIn && !usesWebAudio && isIosAudioSession();

  if (fadeIn && usesWebAudio && isIosAudioSession()) {
    logAudioVolumeDebug("jazzEntryFadePath", {
      path: "webAudioGain",
      durationMs,
    });
  }

  if (fadeIn) {
    primeLoopAudioSilence(audio, track);
  } else {
    setTrackOutputLevel(audio, track, from);
  }

  if (usesWebAudio) {
    const gainNode = track.webAudio!.gain;
    const gainParam = gainNode.gain;
    const ctx = gainNode.context;
    const start = ctx.currentTime;
    const durSec = Math.max(0.001, durationMs / 1000);
    const targetTo = clampVolume(to);
    const startFrom = clampVolume(from);

    gainParam.cancelScheduledValues(start);
    gainParam.setValueAtTime(startFrom, start);
    gainParam.linearRampToValueAtTime(targetTo, start + durSec);

    if (fadeIn && isIosAudioSession()) {
      audio.volume = 1;
      audio.muted = false;
      logAudioVolumeDebug("jazzEntryFadePath", {
        path: "webAudioGainScheduled",
        durationMs,
        from: startFrom,
        to: targetTo,
      });
    }

    track.fadeCompleteTimer = window.setTimeout(() => {
      track.fadeCompleteTimer = null;
      if (track.audio !== audio) return;
      setTrackOutputLevel(audio, track, targetTo);
      if (track.ambient && targetTo > 0) {
        track.ambient.applyNow();
        track.ambient.resume();
      }
      onComplete?.();
    }, durationMs + 32);
    return;
  }

  const startTime = performance.now();

  const applyFadeFrame = (now: number): boolean => {
    if (track.audio !== audio) {
      cancelTrackFade(track);
      return true;
    }

    const linearProgress = Math.min(
      1,
      (now - startTime) / Math.max(1, durationMs),
    );
    const progress = easeInOut(linearProgress);
    // iOS 要素経路 — ambient 係数付きだと target が低いとき閾値を超えず
    // muted のまま完了まで無音→一気に鳴る。入店フェードは to へ直線補間。
    const level = useIosIntervalFade
      ? clampVolume(to * progress)
      : computeFadeLevel(audio, track, from, to, progress);

    if (!usesWebAudio && fadeIn) {
      // iOS 要素 — muted 中は音量変化が聞こえないため、volume>0 で即 unmute
      audio.muted = useIosIntervalFade ? level <= 0 : level <= 0.001;
    }

    setTrackOutputLevel(audio, track, level);

    if (linearProgress >= 1) {
      cancelTrackFade(track);
      setTrackOutputLevel(audio, track, to);
      if (!usesWebAudio && fadeIn) {
        audio.muted = false;
      }
      if (usesWebAudio && fadeIn && isIosAudioSession()) {
        audio.volume = 1;
        audio.muted = false;
        logAudioVolumeDebug("jazzEntryFadePath", {
          path: "webAudioGain",
          keepConnected: true,
          gain: to,
        });
      }
      if (track.ambient && to > 0) {
        track.ambient.applyNow();
        track.ambient.resume();
      }
      onComplete?.();
      return true;
    }

    return false;
  };

  if (useIosIntervalFade) {
    logAudioVolumeDebug("jazzEntryFadePath", {
      path: "elementInterval",
      durationMs,
      fadeStepMs: BAR_AUDIO_TIMING.fadeStepMs,
    });
    applyFadeFrame(startTime);
    track.fadeTimer = setInterval(() => {
      applyFadeFrame(performance.now());
    }, BAR_AUDIO_TIMING.fadeStepMs);
    return;
  }

  const tick = (now: number) => {
    if (applyFadeFrame(now)) return;
    track.fade = requestAnimationFrame(tick);
  };

  track.fade = requestAnimationFrame(tick);
}

function clearTrackAudio(track: LoopingTrackState, audio: HTMLAudioElement) {
  cancelTrackFade(track);
  disposeAmbientController(track);
  disconnectTrackWebAudio(track);
  releaseAudio(audio);
  if (track.audio === audio) {
    track.audio = null;
    track.started = false;
  }
}

const outsideTrack = createInitialTrackState(getBgmMix("outsideAlley"));
const jazzTrack = createInitialTrackState(getBgmMix("jazzCounter"));
let jazzBaseVolume: number = getBgmMix("jazzCounter");
let outsideBaseVolume: number = getBgmMix("outsideAlley");
let outsideBgmMixKey: BgmMixKey = "outsideAlley";
let audioVolumeDevApiInstalled = false;
let jazzPreparePromise: Promise<void> | null = null;
let outsidePreparePromise: Promise<void> | null = null;
/** iOS — 1 要素だけ無音 play 済みなら SE プール全体を触らない */
let barAudioElementUnlockDone = false;

function isIosAudioSession(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPod|iPad/.test(window.navigator.userAgent);
}

/** iOS — ループ BGM（jazz / outside）は Web Audio Gain、それ以外は要素音量 */
function shouldRouteLoopTrackThroughWebAudio(): boolean {
  return !isIosAudioSession();
}

function scaleBgmVolume(volume: number): number {
  return clampVolume(volume * getBgmVolumeMultiplier());
}

function beginOutsideAlleyPreload() {
  if (outsideTrack.started && outsideTrack.audio) return;

  const audio = createAudio(ENTRANCE_SOUNDS.outside, "auto");
  if (!audio) return;

  audio.loop = true;
  audio.volume = 0;
  audio.muted = true;
  outsideTrack.audio = audio;
  outsideTrack.started = true;
  outsideBgmMixKey = "outsideAlley";
  outsideTrack.targetVolume = getBgmMix(outsideBgmMixKey);
  audio.load();
}

/**
 * ユーザー操作の同期コンテキスト内 — outside を無音で play 開始。
 * iOS では await 後の play() が拒否されるため、操作ハンドラから直接呼ぶ。
 */
function primeOutsidePlayOnUserGesture() {
  markBarAudioUserInteraction();
  if (!isBarAudioUnlocked() || isDocumentHidden()) return;

  beginOutsideAlleyPreload();
  const audio = outsideTrack.audio;
  if (!audio) return;

  primeLoopAudioSilence(audio, outsideTrack);
  if (shouldRouteLoopTrackThroughWebAudio() || isIosAudioSession()) {
    void ensureBarAudioContext();
  }
  void audio.play().catch(() => {});
}

async function prepareOutsideForEntry(
  fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  volume: number = getBgmMix("outsideAlley"),
): Promise<void> {
  if (!isBarAudioUnlocked() || shouldBlockBackgroundBgmPlayback()) return;

  if (outsidePreparePromise) {
    await outsidePreparePromise;
    return;
  }

  outsidePreparePromise = (async () => {
    if (shouldBlockBackgroundBgmPlayback()) return;

    beginOutsideAlleyPreload();
    const audio = outsideTrack.audio;
    if (!audio) {
      await startLooping(ENTRANCE_SOUNDS.outside, volume, outsideTrack, fadeMs);
      return;
    }

    outsideTrack.generation += 1;
    const token = outsideTrack.generation;
    outsideBaseVolume = volume;
    outsideBgmMixKey =
      volume <= getBgmMix("outsideLeaving") + 0.02
        ? "outsideLeaving"
        : "outsideAlley";
    const scaledVolume = scaleBgmVolume(volume);
    outsideTrack.targetVolume = scaledVolume;

    await waitForMetadata(audio);
    if (!isTrackAudioCurrent(outsideTrack, token, audio)) return;
    if (shouldBlockBackgroundBgmPlayback()) return;

    if (isIosAudioSession()) {
      const webAudioReady = await ensureIosLoopBgmWebAudio(audio, outsideTrack);
      if (!webAudioReady) {
        logAudioVolumeDebug("outsideEntryFadePath", {
          path: "elementInterval",
          reason: "webAudioSetupFailed",
          durationMs: fadeMs,
        });
      }
    } else {
      await ensureTrackWebAudio(audio, outsideTrack);
    }
    primeLoopAudioSilence(audio, outsideTrack);

    if (audio.paused) {
      if (!(await safePlayLoopTrack(audio, outsideTrack))) {
        clearTrackAudio(outsideTrack, audio);
        return;
      }
    }
    primeLoopAudioSilence(audio, outsideTrack);

    if (!isTrackAudioCurrent(outsideTrack, token, audio)) return;
    if (shouldBlockBackgroundBgmPlayback()) return;

    fadeVolume(
      audio,
      getTrackOutputLevel(audio, outsideTrack),
      scaledVolume,
      fadeMs,
      outsideTrack,
    );
  })();

  try {
    await outsidePreparePromise;
  } finally {
    outsidePreparePromise = null;
  }
}

/**
 * 扉を開ける等のユーザー操作内 — jazz を gain 0 で先行 play→pause。
 * 挨拶完了後の startJazz は resume + フェードのみ（iOS の play 制限を避ける）。
 */
async function prepareJazzForCounterEntry(): Promise<void> {
  markBarAudioUserInteraction();
  if (!isBarAudioUnlocked() || shouldBlockBackgroundBgmPlayback()) return;
  if (jazzPreparePromise) {
    await jazzPreparePromise;
    return;
  }

  jazzPreparePromise = (async () => {
    const syncPrimed = jazzTrack.started && jazzTrack.audio;
    let audio = jazzTrack.audio;

    if (!syncPrimed) {
      audio = createAudio(ENTRANCE_SOUNDS.jazz, "auto");
      if (!audio) return;

      jazzTrack.generation += 1;
      jazzTrack.targetVolume = getBgmMix("jazzCounter");
      audio.loop = true;
      audio.volume = 0;
      jazzTrack.audio = audio;
      jazzTrack.started = true;
      audio.load();
    }

    if (!audio || jazzTrack.audio !== audio) return;

    await waitForMetadata(audio);
    if (jazzTrack.audio !== audio) return;

    if (Number.isFinite(audio.duration) && audio.duration > 1) {
      audio.currentTime = pickRandomStartTime(audio.duration);
    }

    disposeAmbientController(jazzTrack);
    jazzTrack.ambient = createJazzAmbientModulation(audio, jazzTrack);
    jazzTrack.ambient.pause();

    await ensureTrackWebAudio(audio, jazzTrack);
    primeLoopAudioSilence(audio, jazzTrack);

    if (!syncPrimed) {
      if (!(await safePlayLoopTrack(audio, jazzTrack))) {
        clearTrackAudio(jazzTrack, audio);
        return;
      }

      primeLoopAudioSilence(audio, jazzTrack);
      audio.pause();
      primeLoopAudioSilence(audio, jazzTrack);
    } else {
      try {
        audio.pause();
      } catch {
        // ignore
      }
      primeLoopAudioSilence(audio, jazzTrack);
    }
  })();

  try {
    await jazzPreparePromise;
  } finally {
    jazzPreparePromise = null;
  }
}

function replaceSfxPoolSlot(src: string, broken: HTMLAudioElement): void {
  const slots = sfxPool.get(src);
  if (!slots) return;

  const index = slots.indexOf(broken);
  if (index < 0) return;

  releaseAudio(broken);
  const replacement = createAudio(src);
  if (!replacement) return;

  replacement.volume = 0;
  replacement.load();
  wireSfxSlotErrorHandler(src, replacement, index);
  slots[index] = replacement;
}

function resetSfxPool(): void {
  for (const slots of sfxPool.values()) {
    for (const audio of slots) {
      releaseAudio(audio);
    }
  }
  sfxPool.clear();
  sfxKindBySrc.clear();
  sfxPoolInitialized = false;
  sfxPoolCacheRevision = null;
  warmUpPromise = null;
}

function fallbackIosSfxPoolToDefault(kind: BarSfxKind): void {
  if (!isIosSfxTargetKind(kind)) return;

  const iosSrc = resolveBarSfxSrc(kind);
  const defaultSrc = resolveDefaultBarSfxSrc(kind);
  const iosSlots = sfxPool.get(iosSrc);
  if (!iosSlots) return;

  markIosSfxRuntimeFallback(kind);
  logIosSfxSrcDebug("fallbackIosSfxPoolToDefault", {
    kind,
    iosSrc,
    defaultSrc,
    reason: "iosSlotError",
    poolBeforeFallback: snapshotSfxPoolForDebug(),
  });
  for (const audio of iosSlots) {
    releaseAudio(audio);
  }
  sfxPool.delete(iosSrc);
  sfxKindBySrc.delete(iosSrc);

  const slots = [createAudio(defaultSrc), createAudio(defaultSrc)].filter(
    (audio): audio is HTMLAudioElement => audio !== null,
  );
  slots.forEach((audio, slotIndex) => {
    audio.volume = 0;
    wireSfxSlotErrorHandler(defaultSrc, audio, slotIndex, kind);
    audio.load();
  });
  if (slots.length > 0) {
    sfxPool.set(defaultSrc, slots);
    sfxKindBySrc.set(defaultSrc, kind);
  }
}

function wireSfxSlotErrorHandler(
  src: string,
  audio: HTMLAudioElement,
  slotIndex: number,
  kind?: BarSfxKind,
): void {
  if (kind) {
    sfxKindBySrc.set(src, kind);
  }

  audio.addEventListener(
    "error",
    () => {
      const resolvedKind = kind ?? sfxKindBySrc.get(src);
      if (
        resolvedKind &&
        isIosSfxTargetKind(resolvedKind) &&
        isIosSfxResolvedSrc(src, resolvedKind)
      ) {
        fallbackIosSfxPoolToDefault(resolvedKind);
        return;
      }

      const slots = sfxPool.get(src);
      if (!slots || slots[slotIndex] !== audio) return;
      replaceSfxPoolSlot(src, audio);
    },
    { once: true },
  );
}

function ensureSfxPool() {
  if (
    sfxPoolInitialized &&
    sfxPoolCacheRevision !== null &&
    sfxPoolCacheRevision !== IOS_SFX_CACHE_REVISION
  ) {
    logIosSfxSrcDebug("ensureSfxPool.revisionChanged", {
      previousRevision: sfxPoolCacheRevision,
      nextRevision: IOS_SFX_CACHE_REVISION,
      poolBeforeReset: snapshotSfxPoolForDebug(),
    });
    resetSfxPool();
  }

  if (sfxPoolInitialized) {
    logIosSfxSrcDebug("ensureSfxPool.skip", {
      reason: "alreadyInitialized",
      pool: snapshotSfxPoolForDebug(),
      resolveSnapshot: {
        click: readIosSfxResolveDebugInfo("click"),
        door: readIosSfxResolveDebugInfo("door"),
        glassSlide: readIosSfxResolveDebugInfo("glassSlide"),
      },
    });
    return;
  }

  for (const kind of BAR_SFX_KINDS) {
    const src = resolveBarSfxSrc(kind);
    logIosSfxSrcDebug("ensureSfxPool.slot", {
      ...readIosSfxResolveDebugInfo(kind),
      poolInitSrc: src,
    });

    const slots = [createAudio(src), createAudio(src)].filter(
      (audio): audio is HTMLAudioElement => audio !== null,
    );

    slots.forEach((audio, slotIndex) => {
      audio.volume = 0;
      wireSfxSlotErrorHandler(src, audio, slotIndex, kind);
      audio.load();
      logIosSfxSrcDebug("ensureSfxPool.element", {
        kind,
        poolInitSrc: src,
        slotIndex,
        elementSrc: readAudioElementSrc(audio),
      });
    });

    if (slots.length > 0) {
      sfxPool.set(src, slots);
      sfxKindBySrc.set(src, kind);
      queueIosSfxNetworkProof(kind, src);
    }
  }

  sfxPoolInitialized = true;
  sfxPoolCacheRevision = IOS_SFX_CACHE_REVISION;
  logIosSfxSrcDebug("ensureSfxPool.done", {
    pool: snapshotSfxPoolForDebug(),
    resolveSnapshot: {
      click: readIosSfxResolveDebugInfo("click"),
      door: readIosSfxResolveDebugInfo("door"),
      glassSlide: readIosSfxResolveDebugInfo("glassSlide"),
    },
  });
}

/**
 * iOS Safari — 初回ジェスチャーで click を無音 play→pause（プールは汚さない）。
 */
function primeBarAudioUnlockOnFirstGesture(): void {
  if (barAudioElementUnlockDone) return;

  ensureSfxPool();
  const unlockAudio = createAudio(resolveBarSfxSrc("click"));
  if (!unlockAudio) return;

  unlockAudio.volume = 0;
  unlockAudio.muted = true;

  try {
    const playPromise = unlockAudio.play();
    if (!playPromise) {
      releaseAudio(unlockAudio);
      return;
    }

    void playPromise
      .then(() => {
        unlockAudio.pause();
        try {
          unlockAudio.currentTime = 0;
        } catch {
          // ignore
        }
        barAudioElementUnlockDone = true;
      })
      .catch(() => {
        // ignore — 未ロード等
      })
      .finally(() => {
        releaseAudio(unlockAudio);
      });
  } catch {
    releaseAudio(unlockAudio);
  }
}

/** カウンター入店 — jazz を同期コンテキストで無音 play→pause（await 後の resume 用） */
function primeJazzPlayOnUserGesture(): void {
  markBarAudioUserInteraction();
  if (!isBarAudioUnlocked() || isDocumentHidden()) return;

  if (!jazzTrack.started || !jazzTrack.audio) {
    const audio = createAudio(ENTRANCE_SOUNDS.jazz, "auto");
    if (!audio) return;

    jazzTrack.generation += 1;
    jazzTrack.targetVolume = getBgmMix("jazzCounter");
    audio.loop = true;
    audio.volume = 0;
    audio.muted = true;
    jazzTrack.audio = audio;
    jazzTrack.started = true;
    audio.load();
  }

  const audio = jazzTrack.audio;
  if (!audio) return;

  primeLoopAudioSilence(audio, jazzTrack);

  try {
    const playPromise = audio.play();
    if (!playPromise) return;

    void playPromise
      .then(() => {
        audio.pause();
        primeLoopAudioSilence(audio, jazzTrack);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        try {
          audio.pause();
        } catch {
          // ignore
        }
        primeLoopAudioSilence(audio, jazzTrack);
      });
  } catch {
    primeLoopAudioSilence(audio, jazzTrack);
  }
}

/**
 * iOS — 挨拶タップの同期コンテキスト内で jazz を無音再生開始。
 * await 後の play() は拒否されやすく、play 直後に rAF が間に合わないと一瞬鳴る。
 */
function syncJazzCounterEntryPlayInUserGesture(): void {
  if (!isIosAudioSession()) return;
  if (!isBarAudioUnlocked() || isDocumentHidden()) return;

  const audio = jazzTrack.audio;
  if (!audio || !jazzTrack.started) return;

  markBarAudioUserInteraction();

  try {
    audio.pause();
  } catch {
    // ignore
  }

  primeLoopAudioSilence(audio, jazzTrack);

  try {
    const playPromise = audio.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }
  } catch {
    // ignore
  }

  primeLoopAudioSilence(audio, jazzTrack);
}

/**
 * 扉を開ける / カウンターへ — ユーザー操作の同期コンテキスト内で呼ぶ。
 * await より前に必ず実行すること（iOS Safari の再生制限）。
 */
export function primeCounterEntryAudioOnUserGesture(): void {
  unlockBarAudioForUserGesture();
  primeJazzPlayOnUserGesture();
  void prepareJazzForCounterEntry();
}

/** SE プール生成 + decode 待ち */
export function warmUpBarAudio(): Promise<void> {
  ensureAudioVolumeDevApi();

  if (!isBarAudioUnlocked()) {
    return Promise.resolve();
  }

  ensureSfxPool();

  if (!warmUpPromise) {
    warmUpPromise = (async () => {
      const waitTargets: HTMLAudioElement[] = [];

      for (const slots of sfxPool.values()) {
        waitTargets.push(...slots);
      }

      await Promise.all(waitTargets.map((audio) => waitForCanPlay(audio)));
    })();
  }

  return warmUpPromise;
}

async function playSfx(
  kind: BarSfxKind,
  delayMs = 0,
  onEnded?: () => void,
  volumeScale = 1,
): Promise<void> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (isDocumentHidden()) {
    onEnded?.();
    return;
  }

  playSfxNow(kind, onEnded, volumeScale);
}

/** ユーザー操作直後 — await なしで即再生 */
function playSfxNow(
  kind: BarSfxKind,
  onEnded?: () => void,
  volumeScale = 1,
) {
  recoverBarAudioOnUserGesture();

  if (!isBarAudioUnlocked() || !sfxPoolInitialized || isDocumentHidden()) {
    onEnded?.();
    return;
  }

  const src = resolveBarSfxSrc(kind);
  queueIosSfxNetworkProof(kind, src);
  const slots = sfxPool.get(src);
  if (!slots?.length) {
    logIosSfxSrcDebug("playSfxNow.poolMiss", {
      ...readIosSfxResolveDebugInfo(kind),
      poolLookupSrc: src,
      poolKeys: [...sfxPool.keys()],
      pool: snapshotSfxPoolForDebug(),
      playOk: false,
    });
    onEnded?.();
    return;
  }

  if (MONOPHONIC_SFX_KINDS.has(kind)) {
    for (const slot of slots) {
      try {
        slot.pause();
        slot.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }

  const effectiveVolume =
    getSfxPlayVolume(kind) * volumeScale * getSeVolumeMultiplier();

  const orderedSlots = [
    ...slots.filter((slot) => slot.paused),
    ...slots.filter((slot) => !slot.paused),
  ];

  let endedFired = false;
  let endedFallbackTimer: number | null = null;
  let endedListener: (() => void) | null = null;

  const clearEndedWatch = (audio: HTMLAudioElement) => {
    if (endedListener) {
      audio.removeEventListener("ended", endedListener);
      endedListener = null;
    }
    if (endedFallbackTimer !== null) {
      window.clearTimeout(endedFallbackTimer);
      endedFallbackTimer = null;
    }
  };

  const fireEnded = () => {
    if (!onEnded || endedFired) return;
    endedFired = true;
    onEnded();
  };

  const attachEndedWatch = (audio: HTMLAudioElement) => {
    if (!onEnded) return;
    clearEndedWatch(audio);
    endedListener = () => {
      clearEndedWatch(audio);
      fireEnded();
    };
    audio.addEventListener("ended", endedListener, { once: true });
    const durationMs =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.min(audio.duration * 1000 + 120, 4000)
        : 2800;
    endedFallbackTimer = window.setTimeout(() => {
      clearEndedWatch(audio);
      fireEnded();
    }, durationMs);
  };

  const playOnSlot = (audio: HTMLAudioElement, allowRetry: boolean) => {
    audio.volume = effectiveVolume;
    logIosSfxSrcDebug("playSfxNow", {
      ...readIosSfxResolveDebugInfo(kind),
      poolLookupSrc: src,
      slotSrc: readAudioElementSrc(audio),
      poolKeys: [...sfxPool.keys()],
      playVolume: effectiveVolume,
      allowRetry,
    });
    logAudioVolumeDebug("playSfx", {
      kind,
      seMix: getSeMix(kind),
      playVolume: effectiveVolume,
      elementVolumeAfterSet: audio.volume,
      volumeScale,
      seMultiplier: getSeVolumeMultiplier(),
    });
    audio.muted = false;
    audio.currentTime = 0;

    attachEndedWatch(audio);

    const playPromise = audio.play();
    if (!playPromise) {
      logIosSfxSrcDebug("playSfxNow.result", {
        kind,
        resolvedSrc: src,
        slotSrc: readAudioElementSrc(audio),
        runtimeFallback: readIosSfxResolveDebugInfo(kind).runtimeFallback,
        playOk: false,
        reason: "noPlayPromise",
      });
      return;
    }

    void playPromise
      .then(() => {
        logIosSfxSrcDebug("playSfxNow.result", {
          kind,
          resolvedSrc: src,
          slotSrc: readAudioElementSrc(audio),
          runtimeFallback: readIosSfxResolveDebugInfo(kind).runtimeFallback,
          playOk: true,
        });
      })
      .catch((error) => {
        logIosSfxSrcDebug("playSfxNow.result", {
          kind,
          resolvedSrc: src,
          slotSrc: readAudioElementSrc(audio),
          runtimeFallback: readIosSfxResolveDebugInfo(kind).runtimeFallback,
          playOk: false,
          reason: error instanceof Error ? error.message : String(error),
        });
      });

    playPromise.catch(() => {
      clearEndedWatch(audio);
      if (!allowRetry) {
        fireEnded();
        return;
      }

      const alternate = orderedSlots.find(
        (slot) => slot !== audio && slot.paused,
      );
      if (alternate) {
        playOnSlot(alternate, false);
        return;
      }

      replaceSfxPoolSlot(src, audio);
      const rebuilt = sfxPool.get(src)?.find((slot) => slot.paused);
      if (rebuilt) {
        playOnSlot(rebuilt, false);
        return;
      }

      fireEnded();
    });
  };

  playOnSlot(orderedSlots[0], orderedSlots.length > 1);
}

async function startLooping(
  src: string,
  volume: number,
  track: LoopingTrackState,
  fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  enableAmbientModulation = false,
) {
  if (src === ENTRANCE_SOUNDS.jazz && !isPerfAudioEnabled()) return;

  recoverBarAudioOnUserGesture();

  if (!isBarAudioUnlocked() || shouldBlockBackgroundBgmPlayback()) return;

  if (shouldRouteLoopTrackThroughWebAudio()) {
    await ensureBarAudioContext();
  }

  if (src === ENTRANCE_SOUNDS.jazz && jazzPreparePromise) {
    await jazzPreparePromise;
  }

  if (src === ENTRANCE_SOUNDS.outside && outsidePreparePromise) {
    await outsidePreparePromise;
  }

  if (shouldBlockBackgroundBgmPlayback()) return;

  track.generation += 1;
  const token = track.generation;
  if (track === jazzTrack) {
    jazzBaseVolume = volume;
  } else if (track === outsideTrack) {
    outsideBaseVolume = volume;
    outsideBgmMixKey =
      volume <= getBgmMix("outsideLeaving") + 0.02
        ? "outsideLeaving"
        : "outsideAlley";
  }
  const scaledVolume = scaleBgmVolume(volume);
  track.targetVolume = scaledVolume;

  const isJazzCounterEntry =
    track === jazzTrack &&
    enableAmbientModulation &&
    src === ENTRANCE_SOUNDS.jazz;
  const isOutsideBgmEntry =
    track === outsideTrack && src === ENTRANCE_SOUNDS.outside;
  const useIosLoopBgmWebAudio =
    isIosAudioSession() && (isJazzCounterEntry || isOutsideBgmEntry);

  if (track.started && track.audio) {
    const audio = track.audio;

    if (enableAmbientModulation && !track.ambient) {
      track.ambient = createJazzAmbientModulation(audio, track);
      track.ambient.pause();
    }

    let fadeFrom = getTrackOutputLevel(audio, track);

    if (isJazzCounterEntry || audio.paused) {
      await waitForMetadata(audio);
      if (!isTrackAudioCurrent(track, token, audio)) {
        releaseAudio(audio);
        return;
      }
      if (isJazzCounterEntry) {
        audio.currentTime = pickRandomStartTime(audio.duration);
      } else if (audio.paused) {
        audio.currentTime = pickRandomStartTime(audio.duration);
      }

      if (useIosLoopBgmWebAudio) {
        const webAudioReady = await ensureIosLoopBgmWebAudio(audio, track);
        if (!webAudioReady) {
          logAudioVolumeDebug(
            isJazzCounterEntry ? "jazzEntryFadePath" : "outsideEntryFadePath",
            {
              path: "elementInterval",
              reason: "webAudioSetupFailed",
              durationMs: fadeMs,
            },
          );
        }
      } else {
        await ensureTrackWebAudio(audio, track);
      }

      primeLoopAudioSilence(audio, track);

      if (useIosLoopBgmWebAudio) {
        if (audio.paused) {
          if (!(await safePlayLoopTrack(audio, track))) {
            logAudioVolumeDebug("bgmPlayRejected", {
              src,
              track: track === jazzTrack ? "jazz" : "outside",
            });
            return;
          }
        }
      } else if (audio.paused) {
        if (!(await safePlayLoopTrack(audio, track))) {
          logAudioVolumeDebug("bgmPlayRejected", {
            src,
            track: track === jazzTrack ? "jazz" : "outside",
          });
          return;
        }
      }

      if (!isTrackAudioCurrent(track, token, audio)) {
        releaseAudio(audio);
        return;
      }
      primeLoopAudioSilence(audio, track);
      setTrackOutputLevel(audio, track, 0);
      fadeFrom = 0;
    }

    if (!isTrackAudioCurrent(track, token, audio)) {
      return;
    }

    fadeVolume(audio, fadeFrom, scaledVolume, fadeMs, track);
    return;
  }

  const audio = createAudio(src, "auto");
  if (!audio) return;

  audio.loop = true;
  audio.volume = 0;
  track.audio = audio;
  track.started = true;
  audio.load();

  await waitForMetadata(audio);
  if (!isTrackAudioCurrent(track, token, audio)) {
    releaseAudio(audio);
    return;
  }

  audio.currentTime = pickRandomStartTime(audio.duration);

  if (enableAmbientModulation) {
    disposeAmbientController(track);
    track.ambient = createJazzAmbientModulation(audio, track);
    track.ambient.pause();
  }

  if (!isTrackAudioCurrent(track, token, audio)) {
    releaseAudio(audio);
    return;
  }

  try {
    if (useIosLoopBgmWebAudio) {
      await ensureIosLoopBgmWebAudio(audio, track);
    } else {
      await ensureTrackWebAudio(audio, track);
    }
    primeLoopAudioSilence(audio, track);

    if (!(await safePlayLoopTrack(audio, track))) {
      if (track.audio === audio) {
        clearTrackAudio(track, audio);
      } else {
        releaseAudio(audio);
      }
      return;
    }
    if (!isTrackAudioCurrent(track, token, audio)) {
      releaseAudio(audio);
      return;
    }
    primeLoopAudioSilence(audio, track);
    fadeVolume(audio, 0, scaledVolume, fadeMs, track);
  } catch {
    if (track.audio === audio) {
      clearTrackAudio(track, audio);
    } else {
      releaseAudio(audio);
    }
  }
}

function setLoopingVolume(volume: number, track: LoopingTrackState) {
  if (track === jazzTrack) {
    jazzBaseVolume = volume;
  } else if (track === outsideTrack) {
    outsideBaseVolume = volume;
    outsideBgmMixKey =
      volume <= getBgmMix("outsideLeaving") + 0.02
        ? "outsideLeaving"
        : "outsideAlley";
  }
  const scaledVolume = scaleBgmVolume(volume);
  track.targetVolume = scaledVolume;
  const audio = track.audio;
  if (!audio) return;
  cancelTrackFade(track);
  if (track.ambient) {
    track.ambient.applyNow();
    return;
  }
  setTrackOutputLevel(audio, track, scaledVolume);
}

function stopLooping(
  track: LoopingTrackState,
  immediate = false,
  fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
) {
  track.generation += 1;
  const audio = track.audio;
  if (!audio) return;

  if (immediate) {
    clearTrackAudio(track, audio);
    return;
  }

  track.ambient?.pause();
  fadeVolume(audio, getTrackOutputLevel(audio, track), 0, fadeMs, track, () => {
    if (track.audio !== audio) {
      releaseAudio(audio);
      return;
    }
    clearTrackAudio(track, audio);
  });
}

function snapshotLoopTrack(
  track: LoopingTrackState,
): Record<string, unknown> | null {
  if (!track.started && !track.audio) return null;

  const audio = track.audio;
  return {
    started: track.started,
    paused: audio?.paused ?? true,
    currentVolume: audio?.volume ?? null,
    targetVolume: track.targetVolume,
    effectiveOutput:
      audio != null ? getTrackOutputLevel(audio, track) : null,
    webAudioGain: track.webAudio?.gain.gain.value ?? null,
    usesWebAudio: track.webAudio !== null,
    currentTime: audio?.currentTime ?? null,
    duration: Number.isFinite(audio?.duration) ? audio?.duration : null,
    fadeActive: track.fade !== null,
    hasAmbientModulation: track.ambient !== null,
    generation: track.generation,
  };
}

function stopAllActiveSfx() {
  for (const slots of sfxPool.values()) {
    for (const audio of slots) {
      if (audio.paused) continue;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }
}

/**
 * 録音開始直後 — MediaRecorder.start() と同一ターンで pause する。
 * 録音が始まってから非同期で pause すると iOS で MediaRecorder が中断される。
 */
function silenceTrackForRecording(track: LoopingTrackState) {
  const audio = track.audio;
  if (!audio || !track.started) return;

  cancelTrackFade(track);
  track.ambient?.pause();
  if (track.webAudio) {
    track.webAudio.gain.gain.value = 0;
  }
  audio.volume = 0;
  audio.muted = true;
  try {
    audio.pause();
  } catch {
    // ignore
  }
}

function restoreTrackAfterRecording(track: LoopingTrackState) {
  const audio = track.audio;
  if (!audio || !track.started) return;
  if (track.webAudio) {
    track.webAudio.gain.gain.value = 0;
    audio.muted = false;
    audio.volume = 1;
    return;
  }
  audio.volume = 0;
}

async function resumePausedLoopTrack(
  track: LoopingTrackState,
  fadeMs: number,
): Promise<void> {
  const audio = track.audio;
  if (!audio || !track.started) {
    return;
  }

  cancelTrackFade(track);
  track.ambient?.pause();

  try {
    if (audio.paused) {
      await ensureTrackWebAudio(audio, track);
      primeLoopAudioSilence(audio, track);
      if (!(await safePlayLoopTrack(audio, track))) {
        logRecordingPipeline("resumePausedLoopTrack: play failed", {
          error: "play rejected",
        });
        return;
      }
      primeLoopAudioSilence(audio, track);
    }
  } catch (error) {
    logRecordingPipeline("resumePausedLoopTrack: play failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (track.audio !== audio) return;

  primeLoopAudioSilence(audio, track);
  fadeVolume(audio, 0, track.targetVolume, fadeMs, track);
}

function snapshotActiveSfx(): Array<Record<string, unknown>> {
  const active: Array<Record<string, unknown>> = [];

  for (const [src, slots] of sfxPool.entries()) {
    for (const audio of slots) {
      if (audio.paused) continue;
      active.push({
        src,
        volume: audio.volume,
        currentTime: audio.currentTime,
      });
    }
  }

  return active;
}

/** 録音開始時の BGM / SE 状態スナップショット（診断ログ用） */
export function getBarAudioDiagnostics(): Record<string, unknown> {
  return {
    bgmPausedForRecording,
    appBackgroundSuspended,
    sfxPoolInitialized,
    barAudioUnlocked: barAudioUserGestureUnlocked,
    usesIosElementVolume: !shouldRouteLoopTrackThroughWebAudio(),
    tuning: {
      jazzCounterMix: getBgmMix("jazzCounter"),
      outsideAlleyMix: getBgmMix("outsideAlley"),
      outsideLeavingMix: getBgmMix("outsideLeaving"),
    },
    userBgmMultiplier: getBgmVolumeMultiplier(),
    userSeMultiplier: getSeVolumeMultiplier(),
    jazzBaseVolume,
    outsideBaseVolume,
    outsideBgmMixKey,
    jazz: snapshotLoopTrack(jazzTrack),
    outside: snapshotLoopTrack(outsideTrack),
    activeSfx: snapshotActiveSfx(),
    iosSfx: {
      click: readIosSfxResolveDebugInfo("click"),
      door: readIosSfxResolveDebugInfo("door"),
      glassSlide: readIosSfxResolveDebugInfo("glassSlide"),
      pool: snapshotSfxPoolForDebug(),
    },
  };
}

function ensureAudioVolumeDevApi() {
  if (audioVolumeDevApiInstalled || typeof window === "undefined") return;
  audioVolumeDevApiInstalled = true;
  installAudioVolumeDevApi(() => {
    barAudioEngine.reapplyTuningVolumes();
  });
  installIosSfxNetworkProofApi();
}

export const barAudioEngine = {
  warmUp: warmUpBarAudio,

  /** メニュー SE — unlock とプール生成を同期で済ませる */
  primeMenuSfxForUserGesture() {
    unlockBarAudioForUserGesture();
  },

  /** カウンター入店 — await 前に必ず呼ぶ（iOS Safari） */
  primeCounterEntryOnUserGesture() {
    primeCounterEntryAudioOnUserGesture();
  },

  isOutsidePlaying() {
    return isLoopTrackPlaying(outsideTrack);
  },

  /** フェードイン途中も含め — 路地ループが既に立ち上がっているか */
  hasOutsideSession() {
    return Boolean(outsideTrack.started && outsideTrack.audio);
  },

  /** 扉を開ける操作内 — jazz を無音で先行ロード */
  prepareJazzForCounterEntry() {
    void prepareJazzForCounterEntry();
  },

  /** ユーザー操作の同期コンテキスト内 — outside を無音で play 開始 */
  primeOutsidePlayOnUserGesture() {
    primeOutsidePlayOnUserGesture();
  },

  /** メタデータ待ち + Web Audio フェード（play は primeOutsidePlayOnUserGesture 側） */
  prepareOutsideForEntry(
    fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
    volume: number = getBgmMix("outsideAlley"),
  ) {
    recoverBarAudioOnUserGesture();
    void prepareOutsideForEntry(fadeMs, volume);
  },

  startOutside(
    volume: number = getBgmMix("outsideAlley"),
    fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  ) {
    recoverBarAudioOnUserGesture();
    if (shouldRouteLoopTrackThroughWebAudio() || isIosAudioSession()) {
      void ensureBarAudioContext();
    }
    void prepareOutsideForEntry(fadeMs, volume);
  },

  setOutsideVolume(volume: number) {
    setLoopingVolume(volume, outsideTrack);
  },

  stopOutside(
    immediate = false,
    fadeMs: number = BAR_AUDIO_TIMING.outsideStopFadeMs,
  ) {
    stopLooping(outsideTrack, immediate, fadeMs);
  },

  startJazz(
    volume: number = getBgmMix("jazzCounter"),
    fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  ) {
    recoverBarAudioOnUserGesture();
    if (!isPerfAudioEnabled()) return;
    if (shouldRouteLoopTrackThroughWebAudio() || isIosAudioSession()) {
      void ensureBarAudioContext();
    }
    syncJazzCounterEntryPlayInUserGesture();
    void startLooping(
      ENTRANCE_SOUNDS.jazz,
      volume,
      jazzTrack,
      fadeMs,
      true,
    );
  },

  setJazzVolume(volume: number) {
    setLoopingVolume(volume, jazzTrack);
  },

  reapplyUserBgmVolume() {
    if (jazzTrack.audio) {
      setLoopingVolume(jazzBaseVolume, jazzTrack);
    }
    if (outsideTrack.audio) {
      setLoopingVolume(outsideBaseVolume, outsideTrack);
    }
  },

  /** localStorage オーバーライドや tuning 変更後 — 再生中トラックへ即反映 */
  reapplyTuningVolumes() {
    ensureClientPlatformAudioMixReady();
    if (jazzTrack.audio && jazzTrack.started) {
      setLoopingVolume(getBgmMix("jazzCounter"), jazzTrack);
    }
    if (outsideTrack.audio && outsideTrack.started) {
      setLoopingVolume(getBgmMix(outsideBgmMixKey), outsideTrack);
    }
  },

  stopJazz(fadeMs: number = BAR_AUDIO_TIMING.fadeMs) {
    bgmPausedForRecording = false;
    stopLooping(jazzTrack, false, fadeMs);
  },

  /**
   * 録音開始後 — SE 停止 + BGM 無音化（pause しない）。
   * getUserMedia / MediaRecorder.start の成功後に同期的に呼ぶこと。
   */
  pauseJazzForRecording() {
    bgmPausedForRecording = true;
    stopAllActiveSfx();
    silenceTrackForRecording(outsideTrack);
    silenceTrackForRecording(jazzTrack);

    logRecordingPipeline("pauseJazzForRecording: silenced (no pause)", {
      audio: getBarAudioDiagnostics(),
    });
  },

  /** 録音終了後 — 保持していた jazz を通常音量でフェードイン再開 */
  resumeJazzAfterRecording() {
    if (!bgmPausedForRecording) return;
    if (shouldBlockBackgroundBgmPlayback()) return;
    bgmPausedForRecording = false;
    restoreTrackAfterRecording(outsideTrack);
    restoreTrackAfterRecording(jazzTrack);

    if (!jazzTrack.started || !jazzTrack.audio) {
      logRecordingPipeline("resumeJazzAfterRecording: restart jazz (no track)", {
        targetVolume: getBgmMix("jazzCounter"),
        fadeMs: BAR_AUDIO_TIMING.fadeMs,
      });
      void startLooping(
        ENTRANCE_SOUNDS.jazz,
        getBgmMix("jazzCounter"),
        jazzTrack,
        BAR_AUDIO_TIMING.fadeMs,
        true,
      );
      return;
    }

    logRecordingPipeline("resumeJazzAfterRecording: fade in existing track", {
      targetVolume: jazzTrack.targetVolume,
      fadeMs: BAR_AUDIO_TIMING.fadeMs,
    });

    void resumePausedLoopTrack(jazzTrack, BAR_AUDIO_TIMING.fadeMs);
  },

  playDoor(options?: { volumeScale?: number }) {
    void playSfx("door", 0, undefined, options?.volumeScale ?? 1);
  },

  playGlassSlide(
    options?: number | { delayMs?: number; onEnded?: () => void },
  ) {
    const delayMs =
      typeof options === "number"
        ? options
        : (options?.delayMs ?? BAR_AUDIO_TIMING.glassSlideDelayMs);
    const onEnded = typeof options === "object" ? options?.onEnded : undefined;
    void playSfx("glassSlide", delayMs, onEnded);
  },

  playClick() {
    playSfxNow("click");
  },

  playMenuOpen() {
    playSfxNow("menuOpen");
  },

  playMenuClick() {
    playSfxNow("menuClick");
  },

  playPage() {
    playSfxNow("page");
  },

  playSend() {
    playSfxNow("send");
  },

  playThink() {
    playSfxNow("think");
  },

  dispose() {
    bgmPausedForRecording = false;
    appBackgroundSuspended = false;
    barAudioElementUnlockDone = false;
    stopLooping(outsideTrack, true);
    stopLooping(jazzTrack, true);
    resetSfxPool();
  },
};
