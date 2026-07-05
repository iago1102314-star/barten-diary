"use client";

import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import type { BarSfxKind } from "@/lib/entrance/audio-volume-tuning";
import { isMobileIosAudioPlatform } from "@/lib/entrance/audio-volume-platform";
import {
  IOS_SFX_CACHE_REVISION,
  IOS_SFX_FILE_AVAILABLE,
  IOS_SFX_FILE_BYTE_LENGTH,
} from "@/lib/entrance/generated-ios-sfx-manifest";

/** iOS 専用にファイル差し替えする SE */
export const IOS_SFX_TARGET_KINDS = [
  "click",
  "door",
  "glassSlide",
  "send",
  "menuOpen",
  "menuClick",
  "page",
  "think",
] as const satisfies readonly BarSfxKind[];

export type IosSfxTargetKind = (typeof IOS_SFX_TARGET_KINDS)[number];

const iosSfxRuntimeFallbackKinds = new Set<BarSfxKind>();

export function markIosSfxRuntimeFallback(kind: IosSfxTargetKind): void {
  iosSfxRuntimeFallbackKinds.add(kind);
}

/** public/sounds/ios/ 配下 — grass.mp4 は glassSlide の別名（query なしのベースパス） */
export const IOS_SFX_PATHS: Record<IosSfxTargetKind, string> = {
  click: "/sounds/ios/click.mp4",
  door: "/sounds/ios/door.mp4",
  glassSlide: "/sounds/ios/grass.mp4",
  send: "/sounds/ios/send.mp4",
  menuOpen: "/sounds/ios/menu-open.mp4",
  menuClick: "/sounds/ios/menu-click.mp4",
  page: "/sounds/ios/page.mp4",
  think: "/sounds/ios/think.mp4",
};

export function getIosSfxCacheQueryValue(): string {
  return `ios-sfx-${IOS_SFX_CACHE_REVISION}`;
}

/** Safari キャッシュ回避 — ios 専用 SE のみ ?v=ios-sfx-N を付与 */
export function withIosSfxCacheBust(path: string): string {
  return `${path}?v=${getIosSfxCacheQueryValue()}`;
}

export function stripIosSfxCacheQuery(src: string): string {
  const queryIndex = src.indexOf("?");
  return queryIndex >= 0 ? src.slice(0, queryIndex) : src;
}

export function isIosSfxResolvedSrc(
  src: string,
  kind: IosSfxTargetKind,
): boolean {
  return stripIosSfxCacheQuery(src) === IOS_SFX_PATHS[kind];
}

export function isIosSfxTargetKind(kind: BarSfxKind): kind is IosSfxTargetKind {
  return (IOS_SFX_TARGET_KINDS as readonly string[]).includes(kind);
}

export function isIosSfxFileAvailable(kind: IosSfxTargetKind): boolean {
  return IOS_SFX_FILE_AVAILABLE[kind];
}

/** iOS 実機かつ専用ファイルがある SE か（mix は PC 側 tuning を使う） */
export function isIosSfxFileActive(kind: BarSfxKind): boolean {
  return (
    isMobileIosAudioPlatform() &&
    isIosSfxTargetKind(kind) &&
    isIosSfxFileAvailable(kind) &&
    !iosSfxRuntimeFallbackKinds.has(kind)
  );
}

/** SE 再生・プール用の実パス — PC/Android は既存、iOS は専用ファイルへ fallback */
export function resolveBarSfxSrc(kind: BarSfxKind): string {
  if (isIosSfxFileActive(kind) && isIosSfxTargetKind(kind)) {
    return withIosSfxCacheBust(IOS_SFX_PATHS[kind]);
  }
  return ENTRANCE_SOUNDS[kind];
}

export function resolveDefaultBarSfxSrc(kind: BarSfxKind): string {
  return ENTRANCE_SOUNDS[kind];
}

export function hasIosSfxRuntimeFallback(kind: BarSfxKind): boolean {
  return iosSfxRuntimeFallbackKinds.has(kind);
}

/** SE3 — 実際に鳴っている URL を切り分ける診断ログ（NEXT_PUBLIC_AUDIO_VOLUME_DEBUG=true のみ） */
export function isIosSfxSrcDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUDIO_VOLUME_DEBUG === "true";
}

export function logIosSfxSrcDebug(
  label: string,
  data: Record<string, unknown>,
): void {
  if (!isIosSfxSrcDebugEnabled()) return;
  console.log(`[ios-sfx-src] ${label}`, data);
}

export function readIosSfxResolveDebugInfo(kind: BarSfxKind) {
  const resolvedSrc = resolveBarSfxSrc(kind);
  const defaultSrc = resolveDefaultBarSfxSrc(kind);
  const iosTarget = isIosSfxTargetKind(kind);
  const iosBasePath = iosTarget ? IOS_SFX_PATHS[kind] : null;

  return {
    kind,
    resolvedSrc,
    defaultSrc,
    cacheRevision: IOS_SFX_CACHE_REVISION,
    cacheQuery: getIosSfxCacheQueryValue(),
    expectedByteLength:
      iosTarget && isIosSfxTargetKind(kind)
        ? IOS_SFX_FILE_BYTE_LENGTH[kind]
        : null,
    isIos: isMobileIosAudioPlatform(),
    isIosSfxTarget: iosTarget,
    manifestAvailable: iosTarget ? isIosSfxFileAvailable(kind) : null,
    isIosSfxFileActive: isIosSfxFileActive(kind),
    runtimeFallback: hasIosSfxRuntimeFallback(kind),
    manifest: { ...IOS_SFX_FILE_AVAILABLE },
    iosPath: iosBasePath,
    iosPathWithCacheBust:
      iosBasePath && iosTarget ? withIosSfxCacheBust(iosBasePath) : null,
    usesIosFile:
      iosTarget && stripIosSfxCacheQuery(resolvedSrc) === IOS_SFX_PATHS[kind],
    usesDefaultFile: resolvedSrc === defaultSrc,
  };
}
