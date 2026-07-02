/**
 * SE3 等の実機切り分け — app-shell / iOS Safari 高さ補正の ON/OFF
 *
 * 優先順位（クライアント）: URL クエリ → localStorage → NEXT_PUBLIC_* → 既定 ON
 *
 * URL 例:
 *   ?layoutShell=off        … app-shell + portal-root を無効（従来の body 直配置）
 *   ?layoutIosHeight=off    … iOS Safari innerHeight 補正を無効
 *
 * localStorage キー:
 *   barten.layout.appShell       … "on" | "off"
 *   barten.layout.iosSafariHeight … "on" | "off"
 *
 * 環境変数（ビルド時）:
 *   NEXT_PUBLIC_LAYOUT_APP_SHELL=false
 *   NEXT_PUBLIC_LAYOUT_IOS_SAFARI_HEIGHT=false
 */

import { isNonProd } from "@/lib/env/app-env";

export const LAYOUT_FLAG_STORAGE_KEYS = {
  appShell: "barten.layout.appShell",
  iosSafariHeight: "barten.layout.iosSafariHeight",
} as const;

export const LAYOUT_FLAG_URL_PARAMS = {
  appShell: "layoutShell",
  iosSafariHeight: "layoutIosHeight",
} as const;

export type LayoutFeatureFlagId = "appShell" | "iosSafariHeight";

const FLAG_ENV_KEYS: Record<LayoutFeatureFlagId, string> = {
  appShell: "NEXT_PUBLIC_LAYOUT_APP_SHELL",
  iosSafariHeight: "NEXT_PUBLIC_LAYOUT_IOS_SAFARI_HEIGHT",
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

function readEnvEnabled(flag: LayoutFeatureFlagId): boolean | null {
  const raw = process.env[FLAG_ENV_KEYS[flag]];
  return parseTriState(raw ?? undefined);
}

function readUrlEnabled(flag: LayoutFeatureFlagId): boolean | null {
  if (typeof window === "undefined") return null;
  const param =
    flag === "appShell"
      ? LAYOUT_FLAG_URL_PARAMS.appShell
      : LAYOUT_FLAG_URL_PARAMS.iosSafariHeight;
  return parseTriState(new URLSearchParams(window.location.search).get(param));
}

function readStorageEnabled(flag: LayoutFeatureFlagId): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const key =
      flag === "appShell"
        ? LAYOUT_FLAG_STORAGE_KEYS.appShell
        : LAYOUT_FLAG_STORAGE_KEYS.iosSafariHeight;
    return parseTriState(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function resolveLayoutFlag(flag: LayoutFeatureFlagId, defaultEnabled = true): boolean {
  const fromUrl = readUrlEnabled(flag);
  if (fromUrl !== null) return fromUrl;

  const fromStorage = readStorageEnabled(flag);
  if (fromStorage !== null) return fromStorage;

  const fromEnv = readEnvEnabled(flag);
  if (fromEnv !== null) return fromEnv;

  return defaultEnabled;
}

/** SSR 用 — 環境変数のみ（localStorage / URL は未評価） */
export function isLayoutAppShellEnabledServer(): boolean {
  return readEnvEnabled("appShell") ?? true;
}

export function isLayoutIosSafariHeightEnabledServer(): boolean {
  return readEnvEnabled("iosSafariHeight") ?? true;
}

export function isLayoutAppShellEnabled(): boolean {
  return resolveLayoutFlag("appShell");
}

export function isLayoutIosSafariHeightEnabled(): boolean {
  return resolveLayoutFlag("iosSafariHeight");
}

export function readLayoutFeatureFlags(): {
  appShell: boolean;
  iosSafariHeight: boolean;
} {
  return {
    appShell: isLayoutAppShellEnabled(),
    iosSafariHeight: isLayoutIosSafariHeightEnabled(),
  };
}

export function readLayoutFeatureFlagsServer(): {
  appShell: boolean;
  iosSafariHeight: boolean;
} {
  return {
    appShell: isLayoutAppShellEnabledServer(),
    iosSafariHeight: isLayoutIosSafariHeightEnabledServer(),
  };
}

export function setLayoutFeatureFlag(
  flag: LayoutFeatureFlagId,
  enabled: boolean,
): void {
  if (typeof window === "undefined") return;
  const key =
    flag === "appShell"
      ? LAYOUT_FLAG_STORAGE_KEYS.appShell
      : LAYOUT_FLAG_STORAGE_KEYS.iosSafariHeight;
  try {
    window.localStorage.setItem(key, enabled ? "on" : "off");
  } catch {
    // private mode 等
  }
}

export function clearLayoutFeatureFlagStorage(flag: LayoutFeatureFlagId): void {
  if (typeof window === "undefined") return;
  const key =
    flag === "appShell"
      ? LAYOUT_FLAG_STORAGE_KEYS.appShell
      : LAYOUT_FLAG_STORAGE_KEYS.iosSafariHeight;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** 切り分けパネル — local / Vercel dev のみ */
export function isLayoutFeatureFlagPanelEnabled(): boolean {
  return isNonProd;
}
