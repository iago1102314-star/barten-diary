"use client";

import { ENTRANCE_SOUNDS } from "@/lib/entrance/asset-paths";
import type { BarSfxKind } from "@/lib/entrance/audio-volume-tuning";
import { isMobileIosAudioPlatform } from "@/lib/entrance/audio-volume-platform";
import { IOS_SFX_FILE_AVAILABLE } from "@/lib/entrance/generated-ios-sfx-manifest";

/** iOS 専用にファイル差し替えする SE（段階的に拡張） */
export const IOS_SFX_TARGET_KINDS = [
  "click",
  "door",
  "glassSlide",
] as const satisfies readonly BarSfxKind[];

export type IosSfxTargetKind = (typeof IOS_SFX_TARGET_KINDS)[number];

const iosSfxRuntimeFallbackKinds = new Set<BarSfxKind>();

export function markIosSfxRuntimeFallback(kind: IosSfxTargetKind): void {
  iosSfxRuntimeFallbackKinds.add(kind);
}

/** public/sounds/ios/ 配下 — grass.mp4 は glassSlide の別名 */
export const IOS_SFX_PATHS: Record<IosSfxTargetKind, string> = {
  click: "/sounds/ios/click.mp4",
  door: "/sounds/ios/door.mp4",
  glassSlide: "/sounds/ios/grass.mp4",
};

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
    return IOS_SFX_PATHS[kind];
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

  return {
    kind,
    resolvedSrc,
    defaultSrc,
    isIos: isMobileIosAudioPlatform(),
    isIosSfxTarget: iosTarget,
    manifestAvailable: iosTarget ? isIosSfxFileAvailable(kind) : null,
    isIosSfxFileActive: isIosSfxFileActive(kind),
    runtimeFallback: hasIosSfxRuntimeFallback(kind),
    manifest: { ...IOS_SFX_FILE_AVAILABLE },
    iosPath: iosTarget ? IOS_SFX_PATHS[kind] : null,
    usesIosFile: iosTarget && resolvedSrc === IOS_SFX_PATHS[kind],
    usesDefaultFile: resolvedSrc === defaultSrc,
  };
}
