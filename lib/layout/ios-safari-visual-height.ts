/** iOS Safari 通常表示 — ツールバー込みの 100dvh ズレ補正（PWA では無効） */

import {
  LAYOUT_FLAG_STORAGE_KEYS,
  LAYOUT_FLAG_URL_PARAMS,
  isLayoutIosSafariHeightEnabled,
  isLayoutIosSafariHeightEnabledServer,
} from "@/lib/layout/layout-feature-flags";

export const IOS_SAFARI_BROWSER_HEIGHT_CLASS = "ios-safari-browser-height";
export const APP_VISUAL_HEIGHT_VAR = "--app-visual-height";

export function isIosSafariBrowserSession(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(display-mode: standalone)").matches) return false;
  if (
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true
  ) {
    return false;
  }

  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPod|iPad/.test(ua);
  if (!isIos) return false;

  const isSafari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isSafari;
}

export function readAppVisualHeightPx(): number {
  return Math.round(window.innerHeight);
}

export function applyIosSafariVisualHeight(heightPx: number): void {
  document.documentElement.style.setProperty(
    APP_VISUAL_HEIGHT_VAR,
    `${heightPx}px`,
  );
  document.documentElement.classList.add(IOS_SAFARI_BROWSER_HEIGHT_CLASS);
}

export function clearIosSafariVisualHeight(): void {
  document.documentElement.style.removeProperty(APP_VISUAL_HEIGHT_VAR);
  document.documentElement.classList.remove(IOS_SAFARI_BROWSER_HEIGHT_CLASS);
}

export function syncIosSafariVisualHeight(): boolean {
  if (!isLayoutIosSafariHeightEnabled()) {
    clearIosSafariVisualHeight();
    return false;
  }

  if (!isIosSafariBrowserSession()) {
    clearIosSafariVisualHeight();
    return false;
  }

  applyIosSafariVisualHeight(readAppVisualHeightPx());
  return true;
}

/** layout head — 初回ペイント前に高さだけ同期（フラグ OFF 時は no-op） */
export function buildIosSafariVisualHeightBootstrapScript(): string {
  if (!isLayoutIosSafariHeightEnabledServer()) {
    return "";
  }

  const storageKey = LAYOUT_FLAG_STORAGE_KEYS.iosSafariHeight;
  const urlParam = LAYOUT_FLAG_URL_PARAMS.iosSafariHeight;
  const heightVar = APP_VISUAL_HEIGHT_VAR;
  const heightClass = IOS_SAFARI_BROWSER_HEIGHT_CLASS;

  return `(function(){try{function off(){try{var q=new URLSearchParams(location.search);var p=q.get("${urlParam}");if(p==="0"||p==="off"||p==="false")return true;if(localStorage.getItem("${storageKey}")==="off")return true;}catch(e){}return false;}if(off())return;if(window.matchMedia("(display-mode: standalone)").matches)return;if(navigator.standalone)return;var ua=navigator.userAgent;if(!/iPhone|iPod|iPad/.test(ua))return;if(!/Safari/.test(ua)||/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua))return;var h=Math.round(window.innerHeight);document.documentElement.style.setProperty("${heightVar}",h+"px");document.documentElement.classList.add("${heightClass}");}catch(e){}})();`;
}
