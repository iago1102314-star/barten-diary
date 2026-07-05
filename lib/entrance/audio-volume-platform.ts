"use client";

import type { BarSfxKind, BgmMixKey } from "@/lib/entrance/audio-volume-tuning";

/**
 * PC / モバイル（iOS Safari 等）の音量倍率 — AUDIO_VOLUME_TUNING.mix の上に掛ける。
 *
 * - desktop: すべて 1.0（既存 mix をそのまま = PC 調整値を維持）
 * - mobileIos: SE3 実機向け — 個別に 1.0 から微調整（いきなり大きくしない）
 *
 * 最終 BGM ≒ getBgmMix(key) × 設定スライダー
 * 最終 SE  ≒ getSfxPlayVolume(kind) × sceneScale × 設定スライダー
 *
 * SE3 実機チューニング（2026-07）:
 *   大きすぎ → 0.65〜0.75 / バカでかい → 0.40
 *   少し大きい → 0.88 / 小さい → 1.35〜1.45
 *
 * デプロイ確認: コンソールの `[audio-vol] platformMixReady` に revision が出る。
 */

/** SE3 チューニング版 — 実機コンソールで適用確認用 */
export const MOBILE_IOS_AUDIO_MIX_REVISION = 2;

export type PlatformAudioVolumeScaleTable = {
  bgm: Record<BgmMixKey, number> & { default: number };
  se: Record<BarSfxKind, number> & { default: number };
};

/** PC — 倍率 1.0 固定（AUDIO_VOLUME_TUNING が desktop プリセット） */
export const DESKTOP_AUDIO_VOLUME_SCALE: PlatformAudioVolumeScaleTable = {
  bgm: {
    default: 1,
    outsideAlley: 1,
    outsideLeaving: 1,
    jazzCounter: 1,
  },
  se: {
    default: 1,
    door: 1,
    glassSlide: 1,
    send: 1,
    click: 1,
    menuOpen: 1,
    menuClick: 1,
    page: 1,
    think: 1,
  },
};

/**
 * iPhone / iPad / iPod — Safari 実機向け倍率（SE3 聴感ベース）
 *
 * 定数名は AUDIO_VOLUME_TUNING の BgmMixKey / BarSfxKind と一致させる。
 * PC の AUDIO_VOLUME_TUNING.mix は触らない — ここだけ編集する。
 */
export const MOBILE_IOS_AUDIO_VOLUME_SCALE: PlatformAudioVolumeScaleTable = {
  bgm: {
    default: 1,
    outsideAlley: 0.75,
    outsideLeaving: 0.8,
    jazzCounter: 0.4,
  },
  se: {
    default: 1,
    door: 0.65,
    glassSlide: 1.4,
    send: 1.35,
    click: 0.65,
    menuOpen: 0.88,
    menuClick: 0.88,
    page: 0.88,
    think: 1.45,
  },
};

export type AudioVolumePlatformId = "desktop" | "mobileIos";

let clientPlatformId: AudioVolumePlatformId | null = null;

export function isMobileIosAudioPlatform(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iPhone|iPod|iPad/.test(ua)) return true;
  // iPadOS — デスクトップ UA でもタッチ端末
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

export function getPlatformAudioVolumeScaleTable(): PlatformAudioVolumeScaleTable {
  const platform = getAudioVolumePlatformId();
  return platform === "mobileIos"
    ? MOBILE_IOS_AUDIO_VOLUME_SCALE
    : DESKTOP_AUDIO_VOLUME_SCALE;
}

function resolveScale(
  table: PlatformAudioVolumeScaleTable,
  group: "bgm" | "se",
  key: BgmMixKey | BarSfxKind,
): number {
  const entry = table[group][key as keyof typeof table[typeof group]];
  if (typeof entry === "number" && Number.isFinite(entry)) {
    return Math.max(0, entry);
  }
  return table[group].default;
}

/** BGM mix に掛けるプラットフォーム倍率 */
export function getPlatformBgmVolumeScale(key: BgmMixKey): number {
  return resolveScale(getPlatformAudioVolumeScaleTable(), "bgm", key);
}

/** SE mix（peak 補正前）に掛けるプラットフォーム倍率 */
export function getPlatformSeVolumeScale(kind: BarSfxKind): number {
  return resolveScale(getPlatformAudioVolumeScaleTable(), "se", kind);
}

export function readPlatformAudioVolumeDebugInfo() {
  const platform = getAudioVolumePlatformId();
  const table = getPlatformAudioVolumeScaleTable();
  return {
    platform,
    isMobileIos: platform === "mobileIos",
    revision: MOBILE_IOS_AUDIO_MIX_REVISION,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : null,
    scaleTable: table,
  };
}
