/** PC 中央 shell と portal 先 — 767px 以下では viewport 基準のまま */

import {
  isLayoutAppShellEnabled,
  isLayoutPortalRootEnabled,
} from "@/lib/layout/layout-feature-flags";

export const APP_SHELL_ID = "app-shell";
export const APP_PORTAL_ROOT_ID = "app-portal-root";

export const DESKTOP_APP_SHELL_MIN_WIDTH_PX = 768;
export const DESKTOP_APP_SHELL_MAX_WIDTH_PX = 430;

export function isDesktopAppShell(): boolean {
  if (typeof window === "undefined") return false;
  if (!isLayoutAppShellEnabled()) return false;
  return window.matchMedia(
    `(min-width: ${DESKTOP_APP_SHELL_MIN_WIDTH_PX}px)`,
  ).matches;
}

export function getAppShellElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(APP_SHELL_ID);
}

/** portal 先 — shell OFF または未配置時は body（従来挙動） */
export function getAppPortalRoot(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("getAppPortalRoot is only available in the browser");
  }
  if (!isLayoutAppShellEnabled() || !isLayoutPortalRootEnabled()) {
    return document.body;
  }
  return document.getElementById(APP_PORTAL_ROOT_ID) ?? document.body;
}

export function getAppShellRect(): DOMRect | null {
  const shell = getAppShellElement();
  if (!shell || !isDesktopAppShell()) return null;
  return shell.getBoundingClientRect();
}

export type AppStageMetrics = {
  centerX: number;
  centerY: number;
  stageWidth: number;
  stageHeight: number;
};

/** 退場アニメ等 — PC では shell 中央、スマホでは viewport 中央 */
export function getAppStageMetrics(centerOffsetY = 0): AppStageMetrics {
  if (typeof window === "undefined") {
    return { centerX: 0, centerY: 0, stageWidth: 0, stageHeight: 0 };
  }

  const shellRect = getAppShellRect();
  if (shellRect) {
    return {
      centerX: shellRect.left + shellRect.width / 2,
      centerY: shellRect.top + shellRect.height / 2 + centerOffsetY,
      stageWidth: shellRect.width,
      stageHeight: shellRect.height,
    };
  }

  return {
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2 + centerOffsetY,
    stageWidth: window.innerWidth,
    stageHeight: window.innerHeight,
  };
}
