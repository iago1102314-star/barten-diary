import type { LampGlowConfigBase } from "@/lib/entrance/lamp-glow-types";

export type StartLampGlowAnchor =
  | "alley-cold"
  | "alley-cold-2"
  | "alley-neon"
  | "alley-neon-2"
  | "alley-warm-left"
  | "alley-warm-right"
  | "alley-door-warm";

/** 確認用 — 赤点+座標ラベル（位置調整時のみ true） */
export const SHOW_START_LAMP_GLOW_DEBUG_MARKERS = false;

/** 本番 — 光本体を表示（位置調整中は false にする） */
export const SHOW_START_LAMP_GLOW_LIGHT = true;

/** 入口ホーム — 定常光の size / ratio / intensity / tone をスライダー調整 */
export const START_LAMP_GLOW_SHAPE_EDIT_ON_HOME = false;

export function isStartLampGlowHomeEditing(): boolean {
  return START_LAMP_GLOW_SHAPE_EDIT_ON_HOME;
}

/** 赤点モード = 位置調整セッション */
export function isStartLampGlowPositionEditing(): boolean {
  return SHOW_START_LAMP_GLOW_DEBUG_MARKERS;
}

export type StartLampGlowConfig = LampGlowConfigBase & {
  anchor: StartLampGlowAnchor;
};

/**
 * 雨の路地（rain-alley）— アンカー付き LampGlow 7 点
 *
 * 【書き込み場所】この START_LAMP_GLOWS 配列を直接編集する。
 * 位置: 各要素の offsetX / offsetY（%）
 * 形・強さ・色: size / ratio / intensity / tone
 * 呼吸: lib/entrance/start-lamp-glow-breathe.ts
 * 読み込み直後ボケ玉: lib/entrance/start-bokeh-lamp-glows.ts（別配列）
 *
 * 調整UI → ①コピー → ここに貼り付け → ②反映
 */
export const START_LAMP_GLOWS: StartLampGlowConfig[] = [
  {
    id: "alley-cold",
    label: "街灯",
    anchor: "alley-cold",
    offsetX: 28,
    offsetY: 17,
    size: 48,
    ratio: 1,
    tone: "cold",
    intensity: 0.8,
    speed: "7s",
  },
  {
    id: "alley-cold-2",
    label: "コンビニ",
    anchor: "alley-cold-2",
    offsetX: 29,
    offsetY: 35,
    size: 27,
    ratio: 1,
    tone: "cold",
    intensity: 0.25,
    speed: "7s",
  },
  {
    id: "alley-neon",
    label: "看板ネオン",
    anchor: "alley-neon",
    offsetX: 38,
    offsetY: 40,
    size: 20,
    ratio: 0.71,
    tone: "neon",
    intensity: 0.3,
    speed: "5s",
  },
  {
    id: "alley-neon-2",
    label: "看板ネオン2",
    anchor: "alley-neon-2",
    offsetX: 38,
    offsetY: 40,
    size: 9,
    ratio: 1,
    tone: "neon",
    intensity: 1.15,
    speed: "5s",
  },
  {
    id: "alley-warm-left",
    label: "暖色左",
    anchor: "alley-warm-left",
    offsetX: 66,
    offsetY: 45,
    size: 46,
    ratio: 1,
    tone: "warm",
    intensity: 0.25,
    speed: "5.5s",
  },
  {
    id: "alley-warm-right",
    label: "暖色右",
    anchor: "alley-warm-right",
    offsetX: 82,
    offsetY: 44,
    size: 55,
    ratio: 1,
    tone: "warm",
    intensity: 0.35,
    speed: "5.5s",
  },
  {
    id: "alley-door-warm",
    label: "扉・暖色",
    anchor: "alley-door-warm",
    offsetX: 75,
    offsetY: 47,
    size: 92,
    ratio: 0.65,
    tone: "warm",
    intensity: 0.1,
    speed: "5.5s",
  },
];
