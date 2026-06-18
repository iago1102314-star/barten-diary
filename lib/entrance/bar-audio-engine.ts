import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import {
  BAR_AUDIO_LEVELS,
  BAR_AUDIO_TIMING,
} from "@/lib/entrance/audio-levels";

const SFX_SOURCES = [
  ENTRANCE_SOUNDS.door,
  ENTRANCE_SOUNDS.click,
  ENTRANCE_SOUNDS.glassSlide,
  ENTRANCE_SOUNDS.think,
] as const;

function createAudio(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    const audio = new Audio(src);
    audio.preload = "auto";
    return audio;
  } catch {
    return null;
  }
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

type LoopingTrackState = {
  audio: HTMLAudioElement | null;
  started: boolean;
  fade: ReturnType<typeof setInterval> | null;
  targetVolume: number;
  ambient: AmbientVolumeController | null;
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
    generation: 0,
  };
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
    audio.volume = clampVolume(track.targetVolume * multiplier);
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
  if (track.fade) {
    clearInterval(track.fade);
    track.fade = null;
  }
}

function clearTrackAudio(track: LoopingTrackState, audio: HTMLAudioElement) {
  cancelTrackFade(track);
  disposeAmbientController(track);
  releaseAudio(audio);
  if (track.audio === audio) {
    track.audio = null;
    track.started = false;
  }
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

  const steps = Math.max(
    1,
    Math.round(durationMs / BAR_AUDIO_TIMING.fadeStepMs),
  );
  let step = 0;
  audio.volume = from;

  track.fade = setInterval(() => {
    step += 1;
    const progress = step / steps;

    if (track.ambient && to > 0 && from === 0) {
      const duration = audio.duration;
      const ambientMult =
        Number.isFinite(duration) && duration > 0
          ? computeJazzAmbientMultiplier(audio.currentTime, duration)
          : 1;
      audio.volume = clampVolume(track.targetVolume * ambientMult * progress);
    } else {
      audio.volume = from + (to - from) * progress;
    }

    if (step >= steps) {
      cancelTrackFade(track);
      audio.volume = to;
      if (track.ambient && to > 0) {
        track.ambient.applyNow();
        track.ambient.resume();
      }
      onComplete?.();
    }
  }, BAR_AUDIO_TIMING.fadeStepMs);
}

const outsideTrack = createInitialTrackState(BAR_AUDIO_LEVELS.outside.alley);
const jazzTrack = createInitialTrackState(BAR_AUDIO_LEVELS.jazz.counter);

let jazzDuckedForRecording = false;

const sfxPool = new Map<string, HTMLAudioElement[]>();
let sfxPoolInitialized = false;
let warmUpPromise: Promise<void> | null = null;

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

/** SE をプリロードし、ユーザー操作直後にデコードを済ませる */
export function warmUpBarAudio(): Promise<void> {
  ensureSfxPool();

  if (!warmUpPromise) {
    warmUpPromise = (async () => {
      const waitTargets: HTMLAudioElement[] = [];

      for (const slots of sfxPool.values()) {
        waitTargets.push(...slots);
      }

      await Promise.all(waitTargets.map((audio) => waitForCanPlay(audio)));

      for (const audio of waitTargets) {
        const volume = audio.volume;
        audio.volume = 0;
        try {
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // 自動再生ポリシー等は無視（扉ボタン操作後なら通る想定）
        }
        audio.volume = volume;
      }
    })();
  }

  return warmUpPromise;
}

async function playSfx(
  src: string,
  volume: number,
  delayMs = 0,
): Promise<void> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  playSfxNow(src, volume);
}

/** ユーザー操作直後 — await なしで即再生 */
function playSfxNow(src: string, volume: number) {
  ensureSfxPool();
  const slots = sfxPool.get(src);
  if (!slots?.length) return;

  const audio = slots.find((slot) => slot.paused) ?? slots[0];
  audio.volume = volume;
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

async function startLooping(
  src: string,
  volume: number,
  track: LoopingTrackState,
  fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  enableAmbientModulation = false,
) {
  track.generation += 1;
  const token = track.generation;
  track.targetVolume = volume;

  if (track.started && track.audio) {
    const audio = track.audio;
    if (audio.paused) {
      await waitForMetadata(audio);
      if (!isTrackAudioCurrent(track, token, audio)) {
        releaseAudio(audio);
        return;
      }
      audio.currentTime = pickRandomStartTime(audio.duration);
      try {
        await audio.play();
      } catch {
        return;
      }
      if (!isTrackAudioCurrent(track, token, audio)) {
        releaseAudio(audio);
        return;
      }
    }
    if (!isTrackAudioCurrent(track, token, audio)) {
      return;
    }
    fadeVolume(audio, audio.volume, volume, fadeMs, track);
    return;
  }

  const audio = createAudio(src);
  if (!audio) return;

  audio.loop = true;
  audio.volume = 0;
  track.audio = audio;
  track.started = true;

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
    await audio.play();
    if (!isTrackAudioCurrent(track, token, audio)) {
      releaseAudio(audio);
      return;
    }
    fadeVolume(audio, 0, volume, fadeMs, track);
  } catch {
    if (track.audio === audio) {
      clearTrackAudio(track, audio);
    } else {
      releaseAudio(audio);
    }
  }
}

function setLoopingVolume(volume: number, track: LoopingTrackState) {
  track.targetVolume = volume;
  if (!track.audio) return;
  cancelTrackFade(track);
  if (track.ambient) {
    track.ambient.applyNow();
    return;
  }
  track.audio.volume = volume;
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
  fadeVolume(audio, audio.volume, 0, fadeMs, track, () => {
    if (track.audio !== audio) {
      releaseAudio(audio);
      return;
    }
    clearTrackAudio(track, audio);
  });
}

export const barAudioEngine = {
  warmUp: warmUpBarAudio,

  startOutside(
    volume: number = BAR_AUDIO_LEVELS.outside.alley,
    fadeMs: number = BAR_AUDIO_TIMING.fadeMs,
  ) {
    void startLooping(ENTRANCE_SOUNDS.outside, volume, outsideTrack, fadeMs);
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

  stopJazz() {
    jazzDuckedForRecording = false;
    stopLooping(jazzTrack);
  },

  /** 録音中 — 止めずに音量を下げる（iOS マイク許可時の急増を抑えつつ BGM を残す） */
  pauseJazzForRecording() {
    const audio = jazzTrack.audio;
    if (!audio || !jazzTrack.started || jazzDuckedForRecording) return;

    jazzDuckedForRecording = true;
    cancelTrackFade(jazzTrack);
    jazzTrack.ambient?.pause();

    const duckVolume =
      jazzTrack.targetVolume * BAR_AUDIO_LEVELS.jazz.recordingDuckRatio;
    fadeVolume(audio, audio.volume, duckVolume, 400, jazzTrack);
  },

  resumeJazzAfterRecording() {
    if (!jazzDuckedForRecording) return;
    jazzDuckedForRecording = false;

    const audio = jazzTrack.audio;
    if (!audio || !jazzTrack.started) return;

    cancelTrackFade(jazzTrack);
    fadeVolume(audio, audio.volume, jazzTrack.targetVolume, 900, jazzTrack);
  },

  playDoor() {
    void playSfx(ENTRANCE_SOUNDS.door, BAR_AUDIO_LEVELS.sfx.door);
  },

  playGlassSlide(delayMs = BAR_AUDIO_TIMING.glassSlideDelayMs) {
    void playSfx(ENTRANCE_SOUNDS.glassSlide, BAR_AUDIO_LEVELS.sfx.glassSlide, delayMs);
  },

  playClick() {
    playSfxNow(ENTRANCE_SOUNDS.click, BAR_AUDIO_LEVELS.sfx.click);
  },

  playThink() {
    void playSfx(ENTRANCE_SOUNDS.think, BAR_AUDIO_LEVELS.sfx.think);
  },

  dispose() {
    jazzDuckedForRecording = false;
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
