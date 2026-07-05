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
 * SE3 検証の目安:
 *   jazzCounter / outsideAlley … 0.05 刻みで 1.0〜1.3
 *   door / click / think … 0.05 刻みで 1.0〜1.4
 */

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
 * iPhone / iPad / iPod — Safari 実機向け倍率（初期は 1.0、SE3 で上書き調整）
 *
 * 定数名は AUDIO_VOLUME_TUNING の BgmMixKey / BarSfxKind と一致させる。
 */
export const MOBILE_IOS_AUDIO_VOLUME_SCALE: PlatformAudioVolumeScaleTable = {
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

export type AudioVolumePlatformId = "desktop" | "mobileIos";

export function isMobileIosAudioPlatform(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPod|iPad/.test(window.navigator.userAgent);
}

export function getAudioVolumePlatformId(): AudioVolumePlatformId {
  return isMobileIosAudioPlatform() ? "mobileIos" : "desktop";
}

export function getPlatformAudioVolumeScaleTable(): PlatformAudioVolumeScaleTable {
  return isMobileIosAudioPlatform()
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
    scaleTable: table,
  };
}
