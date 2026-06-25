export type AudioPreferences = {
  bgm: number;
  se: number;
};

const STORAGE_KEY = "barten-audio-preferences";
const DEFAULTS: AudioPreferences = { bgm: 1, se: 1 };

type AudioPreferencesListener = (prefs: AudioPreferences) => void;
const listeners = new Set<AudioPreferencesListener>();

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function readRaw(): AudioPreferences {
  if (typeof window === "undefined") return DEFAULTS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AudioPreferences>;
    return {
      bgm: clamp(parsed.bgm ?? DEFAULTS.bgm),
      se: clamp(parsed.se ?? DEFAULTS.se),
    };
  } catch {
    return DEFAULTS;
  }
}

function notify(prefs: AudioPreferences) {
  for (const listener of listeners) {
    listener(prefs);
  }
}

export function getAudioPreferences(): AudioPreferences {
  return readRaw();
}

export function getBgmVolumeMultiplier(): number {
  return readRaw().bgm;
}

export function getSeVolumeMultiplier(): number {
  return readRaw().se;
}

export function setAudioPreferences(patch: Partial<AudioPreferences>): AudioPreferences {
  const next = {
    bgm: clamp(patch.bgm ?? readRaw().bgm),
    se: clamp(patch.se ?? readRaw().se),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  notify(next);
  return next;
}

export function subscribeAudioPreferences(
  listener: AudioPreferencesListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
