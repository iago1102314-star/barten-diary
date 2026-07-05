"use client";

import type { BarSfxKind, BgmMixKey } from "@/lib/entrance/audio-volume-tuning";

/**
 * iOS 実機向けの絶対 mix 値 — PC の AUDIO_VOLUME_TUNING.mix は触らない。
 *
 * 倍率掛けではなく iOS 専用の目標 mix を直接指定する（SE3 聴感ベース）。
 * 調整はこのファイルの MOBILE_IOS_AUDIO_MIX のみ編集。
 *
 * デプロイ確認: `[audio-vol] platformMixReady` の revision
 */

/** SE3 チューニング版 — 実機コンソールで適用確認用 */
export const MOBILE_IOS_AUDIO_MIX_REVISION = 4;

/**
 * iPhone / iPad — Safari 実機 mix（PC 値とは独立）
 *
 * SE3 フィードバック（2026-07）:
 *   jazzCounter … 店内ジャズが大きすぎ → 下記 bgm.jazzCounter で調整
 *   door/click … click/door/glassSlide は ios 音源で調整
 *   think/send/grass … 小さい → 下記 mix で補正（ios 音源なしの SE）
 */
export const MOBILE_IOS_AUDIO_MIX = {
  bgm: {
    outsideAlley: 0.16,
    outsideLeaving: 0.09,
    jazzCounter: 0.011,
  },
  se: {
    door: 0.07,
    glassSlide: 0.78,
    send: 0.55,
    click: 0.09,
    menuOpen: 0.24,
    menuClick: 0.21,
    page: 0.32,
    think: 0.95,
  },
} as const satisfies {
  bgm: Record<BgmMixKey, number>;
  se: Record<BarSfxKind, number>;
};

export type AudioVolumePlatformId = "desktop" | "mobileIos";

let clientPlatformId: AudioVolumePlatformId | null = null;

export function isMobileIosAudioPlatform(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iPhone|iPod|iPad/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function resolveClientPlatformId(): AudioVolumePlatformId {
  return isMobileIosAudioPlatform() ? "mobileIos" : "desktop";
}

/** クライアント初回 unlock 前に呼ぶ — SSR 時の desktop 誤判定を捨てる */
export function ensureClientPlatformAudioMixReady(): AudioVolumePlatformId {
  if (typeof window === "undefined") return "desktop";
  clientPlatformId = resolveClientPlatformId();
  return clientPlatformId;
}

export function getAudioVolumePlatformId(): AudioVolumePlatformId {
  if (clientPlatformId) return clientPlatformId;
  if (typeof window === "undefined") return "desktop";
  return resolveClientPlatformId();
}

export function isMobileIosAudioMixActive(): boolean {
  return getAudioVolumePlatformId() === "mobileIos";
}

export function getMobileIosBgmMix(key: BgmMixKey): number {
  return MOBILE_IOS_AUDIO_MIX.bgm[key];
}

export function getMobileIosSeMix(kind: BarSfxKind): number {
  return MOBILE_IOS_AUDIO_MIX.se[kind];
}

export function readPlatformAudioVolumeDebugInfo() {
  const platform = getAudioVolumePlatformId();
  return {
    platform,
    isMobileIos: platform === "mobileIos",
    revision: MOBILE_IOS_AUDIO_MIX_REVISION,
    mixTable: platform === "mobileIos" ? MOBILE_IOS_AUDIO_MIX : null,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : null,
  };
}
