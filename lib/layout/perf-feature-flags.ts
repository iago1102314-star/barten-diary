/**
 * 演出パフォーマンス切り分け — 既定 ON、OFF 時のみ一時的に演出停止
 *
 * URL 例:
 *   ?perfAll=off
 *   ?perfMenuBackdrop=off
 *   ?perfMenuBlur=off
 *   ?perfLampBreathe=off
 *   ?perfGrain=off
 *   ?perfHaze=off
 *
 * localStorage: barten.perf.<id> … "on" | "off"
 */

export const PERF_FLAG_STORAGE_KEYS = {
  all: "barten.perf.all",
  menuBackdrop: "barten.perf.menuBackdrop",
  menuBlur: "barten.perf.menuBlur",
  lampBreathe: "barten.perf.lampBreathe",
  grain: "barten.perf.grain",
  haze: "barten.perf.haze",
} as const;

export const PERF_FLAG_URL_PARAMS = {
  all: "perfAll",
  menuBackdrop: "perfMenuBackdrop",
  menuBlur: "perfMenuBlur",
  lampBreathe: "perfLampBreathe",
  grain: "perfGrain",
  haze: "perfHaze",
} as const;

export type PerfFeatureFlagId = keyof typeof PERF_FLAG_STORAGE_KEYS;

const PERF_FLAG_ENV_KEYS: Record<PerfFeatureFlagId, string> = {
  all: "NEXT_PUBLIC_PERF_ALL",
  menuBackdrop: "NEXT_PUBLIC_PERF_MENU_BACKDROP",
  menuBlur: "NEXT_PUBLIC_PERF_MENU_BLUR",
  lampBreathe: "NEXT_PUBLIC_PERF_LAMP_BREATHE",
  grain: "NEXT_PUBLIC_PERF_GRAIN",
  haze: "NEXT_PUBLIC_PERF_HAZE",
};

function parseTriState(value: string | null | undefined): boolean | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "0" || normalized === "off" || normalized === "false") {
    return false;
  }
  if (normalized === "1" || normalized === "on" || normalized === "true") {
    return true;
  }
  return null;
}

function readEnvEnabled(flag: PerfFeatureFlagId): boolean | null {
  return parseTriState(process.env[PERF_FLAG_ENV_KEYS[flag]] ?? undefined);
}

function readUrlEnabled(flag: PerfFeatureFlagId): boolean | null {
  if (typeof window === "undefined") return null;
  return parseTriState(
    new URLSearchParams(window.location.search).get(PERF_FLAG_URL_PARAMS[flag]),
  );
}

function readStorageEnabled(flag: PerfFeatureFlagId): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    return parseTriState(
      window.localStorage.getItem(PERF_FLAG_STORAGE_KEYS[flag]),
    );
  } catch {
    return null;
  }
}

function resolvePerfFlag(flag: PerfFeatureFlagId, defaultEnabled = true): boolean {
  const fromUrl = readUrlEnabled(flag);
  if (fromUrl !== null) return fromUrl;

  const fromStorage = readStorageEnabled(flag);
  if (fromStorage !== null) return fromStorage;

  const fromEnv = readEnvEnabled(flag);
  if (fromEnv !== null) return fromEnv;

  return defaultEnabled;
}

function isPerfMasterOff(): boolean {
  return resolvePerfFlag("all") === false;
}

function isPerfEffectEnabled(flag: Exclude<PerfFeatureFlagId, "all">): boolean {
  if (isPerfMasterOff()) return false;
  return resolvePerfFlag(flag);
}

export function isPerfMenuBackdropEnabled(): boolean {
  return isPerfEffectEnabled("menuBackdrop");
}

export function isPerfMenuBlurEnabled(): boolean {
  return isPerfEffectEnabled("menuBlur");
}

export function isPerfLampBreatheEnabled(): boolean {
  return isPerfEffectEnabled("lampBreathe");
}

export function isPerfGrainEnabled(): boolean {
  return isPerfEffectEnabled("grain");
}

export function isPerfHazeEnabled(): boolean {
  return isPerfEffectEnabled("haze");
}

export function readPerfFeatureFlags(): Record<PerfFeatureFlagId, boolean> {
  const all = resolvePerfFlag("all");
  const masterOff = all === false;
  return {
    all,
    menuBackdrop: masterOff ? false : resolvePerfFlag("menuBackdrop"),
    menuBlur: masterOff ? false : resolvePerfFlag("menuBlur"),
    lampBreathe: masterOff ? false : resolvePerfFlag("lampBreathe"),
    grain: masterOff ? false : resolvePerfFlag("grain"),
    haze: masterOff ? false : resolvePerfFlag("haze"),
  };
}

export function setPerfFeatureFlag(
  flag: PerfFeatureFlagId,
  enabled: boolean,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PERF_FLAG_STORAGE_KEYS[flag],
      enabled ? "on" : "off",
    );
  } catch {
    // ignore
  }
}

export function clearPerfFeatureFlagStorage(flag: PerfFeatureFlagId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PERF_FLAG_STORAGE_KEYS[flag]);
  } catch {
    // ignore
  }
}

export function clearAllPerfFeatureFlagStorage(): void {
  (Object.keys(PERF_FLAG_STORAGE_KEYS) as PerfFeatureFlagId[]).forEach(
    clearPerfFeatureFlagStorage,
  );
}

/** メニュー CSS 変数 — blur 系だけ無効化 */
export function applyPerfMenuBlurCssOverrides(
  vars: Record<string, string>,
): Record<string, string> {
  if (isPerfMenuBlurEnabled()) return vars;
  return {
    ...vars,
    "--menu-backdrop-filter": "none",
    "--menu-profile-blur": "none",
    "--menu-sheet-blur": "none",
  };
}

export function notifyPerfFlagsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("barten-perf-flags-change"));
}

export function isBisectFeatureFlagPanelEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_BISECT_PANEL === "true";
}
