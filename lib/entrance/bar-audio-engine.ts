import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import {
  getBgmVolumeMultiplier,
  getSeVolumeMultiplier,
} from "@/lib/settings/audio-preferences";
import {
  BAR_AUDIO_LEVELS,
  BAR_AUDIO_TIMING,
  getSfxPlayVolume,
  type BarSfxKind,
} from "@/lib/entrance/audio-levels";
import { logRecordingPipeline } from "@/lib/recorder/recording-pipeline-log";

const SFX_SOURCES = [
  ENTRANCE_SOUNDS.door,
  ENTRANCE_SOUNDS.click,
  ENTRANCE_SOUNDS.menuOpen,
  ENTRANCE_SOUNDS.menuClick,
  ENTRANCE_SOUNDS.glassSlide,
  ENTRANCE_SOUNDS.send,
  ENTRANCE_SOUNDS.page,
  ENTRANCE_SOUNDS.think,
] as const;

const SFX_SRC_BY_KIND: Record<BarSfxKind, string> = {
  door: ENTRANCE_SOUNDS.door,
  click: ENTRANCE_SOUNDS.click,
  menuOpen: ENTRANCE_SOUNDS.menuOpen,
  menuClick: ENTRANCE_SOUNDS.menuClick,
  glassSlide: ENTRANCE_SOUNDS.glassSlide,
  send: ENTRANCE_SOUNDS.send,
  page: ENTRANCE_SOUNDS.page,
  think: ENTRANCE_SOUNDS.think,
};

const sfxPool = new Map<string, HTMLAudioElement[]>();
let sfxPoolInitialized = false;

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
 * ホーム画面・他アプリ・画面ロック — BGM / SE を即停止。
 * フォアグラウンド復帰時の自動再開は行わない（ユーザー操作後のみ）。
 */
export function suspendBarAudioForAppBackground(): void {
  if (typeof document === "undefined") return;

  appBackgroundSuspended = true;
  outsideTrack.generation += 1;
  jazzTrack.generation += 1;
  outsidePreparePromise = null;
  jazzPreparePromise = null;

  pauseLoopTrackForAppBackground(outsideTrack);
  pauseLoopTrackForAppBackground(jazzTrack);
  stopAllActiveSfx();

  if (barAudioContext?.state === "running") {
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
    }
  });

  window.addEventListener("pagehide", () => {
    suspendBarAudioForAppBackground();
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
  markBarAudioUserInteraction();

  const firstUnlock = !barAudioUserGestureUnlocked;
  if (firstUnlock) {
    barAudioUserGestureUnlocked = true;
    prefetchLoopingSource(ENTRANCE_SOUNDS.jazz);
    prefetchLoopingSource(ENTRANCE_SOUNDS.outside);
    beginOutsideAlleyPreload();
    ensureSfxPool();
    primeBarAudioUnlockOnFirstGesture();
    void warmUpBarAudio();
  }

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

async function ensureTrackWebAudio(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): Promise<GainNode | null> {
  if (!shouldRouteLoopTrackThroughWebAudio()) return null;
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

function setTrackOutputLevel(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
  level: number,
) {
  const clamped = clampVolume(level);
  if (track.webAudio) {
    track.webAudio.gain.gain.value = clamped;
    return;
  }
  audio.volume = clamped;
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

function createJazzAmbientModulation(
  audio: HTMLAudioElement,
  track: LoopingTrackState,
): AmbientVolumeController {
  let paused = false;
  let rafId: number | null = null;

  const applyNow = () => {
    if (paused || track.fade || audio.paused) return;

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

function cancelTrackFade(track: LoopingTrackState) {
  if (track.fade !== null) {
    cancelAnimationFrame(track.fade);
    track.fade = null;
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
  if (track.ambient && to > 0 && from === 0) {
    const duration = audio.duration;
    const ambientMult =
      Number.isFinite(duration) && duration > 0
        ? computeJazzAmbientMultiplier(audio.currentTime, duration)
        : 1;
    return clampVolume(track.targetVolume * ambientMult * progress);
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

  if (fadeIn) {
    primeLoopAudioSilence(audio, track);
  } else {
    setTrackOutputLevel(audio, track, from);
  }

  const startTime = performance.now();

  const tick = (now: number) => {
    if (track.audio !== audio) {
      track.fade = null;
      return;
    }

    const linearProgress = Math.min(
      1,
      (now - startTime) / Math.max(1, durationMs),
    );
    const progress = easeInOut(linearProgress);
    const level = computeFadeLevel(audio, track, from, to, progress);

    if (!usesWebAudio && fadeIn && progress > 0) {
      audio.muted = false;
    }

    setTrackOutputLevel(audio, track, level);

    if (linearProgress >= 1) {
      track.fade = null;
      setTrackOutputLevel(audio, track, to);
      if (!usesWebAudio && fadeIn) {
        audio.muted = false;
      }
      if (track.ambient && to > 0) {
        track.ambient.applyNow();
        track.ambient.resume();
      }
      onComplete?.();
      return;
    }

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

const outsideTrack = createInitialTrackState(BAR_AUDIO_LEVELS.outside.alley);
const jazzTrack = createInitialTrackState(BAR_AUDIO_LEVELS.jazz.counter);
let jazzBaseVolume: number = BAR_AUDIO_LEVELS.jazz.counter;
let outsideBaseVolume: number = BAR_AUDIO_LEVELS.outside.alley;
let jazzPreparePromise: Promise<void> | null = null;
let outsidePreparePromise: Promise<void> | null = null;
/** iOS — 1 要素だけ無音 play 済みなら SE プール全体を触らない */
let barAudioElementUnlockDone = false;

function isIosAudioSession(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPod|iPad/.test(window.navigator.userAgent);
}

/** iOS — Web Audio 経路は無音化しやすいため BGM は要素音量を使う */
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
  outsideTrack.targetVolume = BAR_AUDIO_LEVELS.outside.alley;
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
  if (shouldRouteLoopTrackThroughWebAudio()) {
    void ensureBarAudioContext();
  }
  void audio.play().catch(() => {});
}

async function prepareOutsideForEntry(
  fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  volume: number = BAR_AUDIO_LEVELS.outside.alley,
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
    const scaledVolume = scaleBgmVolume(volume);
    outsideTrack.targetVolume = scaledVolume;

    await waitForMetadata(audio);
    if (!isTrackAudioCurrent(outsideTrack, token, audio)) return;
    if (shouldBlockBackgroundBgmPlayback()) return;

    await ensureTrackWebAudio(audio, outsideTrack);
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
      jazzTrack.targetVolume = BAR_AUDIO_LEVELS.jazz.counter;
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
    }
  })();

  try {
    await jazzPreparePromise;
  } finally {
    jazzPreparePromise = null;
  }
}

function ensureSfxPool() {
  if (sfxPoolInitialized) return;

  for (const src of SFX_SOURCES) {
    const slots = [createAudio(src), createAudio(src)].filter(
      (audio): audio is HTMLAudioElement => audio !== null,
    );

    for (const audio of slots) {
      audio.load();
    }

    if (slots.length > 0) {
      sfxPool.set(src, slots);
    }
  }

  sfxPoolInitialized = true;
}

/**
 * iOS Safari — 初回ジェスチャーで click 1 本だけ無音 play→pause（プール全件は重すぎる）。
 */
function primeBarAudioUnlockOnFirstGesture(): void {
  if (barAudioElementUnlockDone) return;

  ensureSfxPool();
  const unlockSlot = sfxPool.get(ENTRANCE_SOUNDS.click)?.[0];
  if (!unlockSlot) return;

  const previousVolume = unlockSlot.volume;
  const previousMuted = unlockSlot.muted;
  unlockSlot.volume = 0;
  unlockSlot.muted = true;

  try {
    const playPromise = unlockSlot.play();
    if (!playPromise) return;

    void playPromise
      .then(() => {
        unlockSlot.pause();
        try {
          unlockSlot.currentTime = 0;
        } catch {
          // ignore
        }
        barAudioElementUnlockDone = true;
      })
      .catch(() => {
        // ignore — 未ロード等
      })
      .finally(() => {
        unlockSlot.muted = previousMuted;
        unlockSlot.volume = previousVolume;
      });
  } catch {
    unlockSlot.muted = previousMuted;
    unlockSlot.volume = previousVolume;
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
    jazzTrack.targetVolume = BAR_AUDIO_LEVELS.jazz.counter;
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

  const previousVolume = audio.volume;
  const previousMuted = audio.muted;
  audio.volume = 0;
  audio.muted = true;

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
        if (audio.paused) {
          audio.muted = previousMuted;
          audio.volume = previousVolume;
        }
      });
  } catch {
    audio.muted = previousMuted;
    audio.volume = previousVolume;
  }
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
  if (!isBarAudioUnlocked() || !sfxPoolInitialized || isDocumentHidden()) {
    onEnded?.();
    return;
  }

  const src = SFX_SRC_BY_KIND[kind];
  const slots = sfxPool.get(src);
  if (!slots?.length) {
    onEnded?.();
    return;
  }

  const audio = slots.find((slot) => slot.paused) ?? slots[0];
  audio.volume = getSfxPlayVolume(kind) * volumeScale * getSeVolumeMultiplier();
  audio.muted = false;
  audio.currentTime = 0;

  if (onEnded) {
    const handleEnded = () => {
      audio.removeEventListener("ended", handleEnded);
      onEnded();
    };
    audio.addEventListener("ended", handleEnded);
  }

  void audio.play().catch(() => {
    onEnded?.();
  });
}

async function startLooping(
  src: string,
  volume: number,
  track: LoopingTrackState,
  fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  enableAmbientModulation = false,
) {
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
  }
  const scaledVolume = scaleBgmVolume(volume);
  track.targetVolume = scaledVolume;

  if (track.started && track.audio) {
    const audio = track.audio;

    if (enableAmbientModulation && !track.ambient) {
      track.ambient = createJazzAmbientModulation(audio, track);
      track.ambient.pause();
    }

    let fadeFrom = getTrackOutputLevel(audio, track);

    if (audio.paused) {
      await waitForMetadata(audio);
      if (!isTrackAudioCurrent(track, token, audio)) {
        releaseAudio(audio);
        return;
      }
      audio.currentTime = pickRandomStartTime(audio.duration);
      await ensureTrackWebAudio(audio, track);
      primeLoopAudioSilence(audio, track);
      if (!(await safePlayLoopTrack(audio, track))) {
        return;
      }
      if (!isTrackAudioCurrent(track, token, audio)) {
        releaseAudio(audio);
        return;
      }
      primeLoopAudioSilence(audio, track);
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
    await ensureTrackWebAudio(audio, track);
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
    barAudioUnlocked: barAudioUserGestureUnlocked,
    jazz: snapshotLoopTrack(jazzTrack),
    outside: snapshotLoopTrack(outsideTrack),
    activeSfx: snapshotActiveSfx(),
  };
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
    volume: number = BAR_AUDIO_LEVELS.outside.alley,
  ) {
    void prepareOutsideForEntry(fadeMs, volume);
  },

  startOutside(
    volume: number = BAR_AUDIO_LEVELS.outside.alley,
    fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  ) {
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
    volume: number = BAR_AUDIO_LEVELS.jazz.counter,
    fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  ) {
    markBarAudioUserInteraction();
    if (shouldRouteLoopTrackThroughWebAudio()) {
      void ensureBarAudioContext();
    }
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

  /** 録音終了後 — 保持していた jazz を通常音量（0.03）でフェードイン再開 */
  resumeJazzAfterRecording() {
    if (!bgmPausedForRecording) return;
    if (shouldBlockBackgroundBgmPlayback()) return;
    bgmPausedForRecording = false;
    restoreTrackAfterRecording(outsideTrack);
    restoreTrackAfterRecording(jazzTrack);

    if (!jazzTrack.started || !jazzTrack.audio) {
      logRecordingPipeline("resumeJazzAfterRecording: restart jazz (no track)", {
        targetVolume: BAR_AUDIO_LEVELS.jazz.counter,
        fadeMs: BAR_AUDIO_TIMING.fadeMs,
      });
      void startLooping(
        ENTRANCE_SOUNDS.jazz,
        BAR_AUDIO_LEVELS.jazz.counter,
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

    for (const slots of sfxPool.values()) {
      for (const audio of slots) {
        releaseAudio(audio);
      }
    }
    sfxPool.clear();
    sfxPoolInitialized = false;
    warmUpPromise = null;
  },
};
