import type { LampGlowShapeFields, LampGlowTone } from "@/lib/entrance/lamp-glow-types";

/** 読み込み直後（ボケ玉 7点）— 光の size / ratio / intensity / tone をスライダー調整 */
export const START_BOKEH_LAMP_GLOW_SHAPE_EDIT_ON_HOME = false;

/** ボケ専用光 — 赤点+座標ラベル（位置調整時のみ true） */
export const SHOW_START_BOKEH_ONLY_POSITION_MARKERS = false;

/** ボケ専用光 — 位置調整セッション */
export const START_BOKEH_ONLY_POSITION_EDIT_ON_HOME = false;

/** ボケ専用光 — size / ratio / intensity / tone をスライダー調整 */
export const START_BOKEH_ONLY_SHAPE_EDIT_ON_HOME = false;

/** 読み込み直後 — rain-alley 背景の不透明度（0 = 不可視, 1 = 定常と同じ） */
export const START_BOKEH_BACKGROUND_OPACITY = 0.18;

export function isStartBokehLampGlowHomeEditing(): boolean {
  return START_BOKEH_LAMP_GLOW_SHAPE_EDIT_ON_HOME;
}

export function isStartBokehOnlyPositionEditing(): boolean {
  return START_BOKEH_ONLY_POSITION_EDIT_ON_HOME;
}

export function isStartBokehOnlyShapeEditing(): boolean {
  return START_BOKEH_ONLY_SHAPE_EDIT_ON_HOME;
}

/** 定常 START_LAMP_GLOWS と id で対応 — 移行時に連続補間する */
export type StartBokehLampGlowConfig = {
  id: string;
  label: string;
  offsetX: number;
  offsetY: number;
  colorRgb?: string;
} & LampGlowShapeFields;

export type StartBokehLampGlowShapeFields = LampGlowShapeFields & {
  offsetX?: number;
  offsetY?: number;
};

/**
 * 雨の路地 — 読み込み直後のボケ玉 7 点
 *
 * 【書き込み場所】この START_BOKEH_LAMP_GLOWS 配列を直接編集する。
 * 定常状態: lib/entrance/start-lamp-glows.ts の START_LAMP_GLOWS（別配列）
 * 移行時: この配列 → START_LAMP_GLOWS へ size / ratio / intensity / tone / 位置を連続補間
 *
 * 調整UI → ①コピー → ここに貼り付け → ②反映
 */
export const START_BOKEH_LAMP_GLOWS: StartBokehLampGlowConfig[] = [
  {
    id: "alley-cold",
    label: "街灯",
    offsetX: 28,
    offsetY: 17,
    size: 13,
    ratio: 1,
    tone: "cold",
    intensity: 2.4,
  },
  {
    id: "alley-cold-2",
    label: "コンビニ",
    offsetX: 29,
    offsetY: 35,
    size: 8,
    ratio: 1,
    tone: "cold",
    intensity: 1.25,
  },
  {
    id: "alley-neon",
    label: "看板ネオン",
    offsetX: 38,
    offsetY: 40,
    size: 9,
    ratio: 0.76,
    tone: "neon",
    intensity: 0.85,
  },
  {
    id: "alley-neon-2",
    label: "看板ネオン2",
    offsetX: 38,
    offsetY: 40,
    size: 3,
    ratio: 1,
    tone: "neon",
    intensity: 3,
  },
  {
    id: "alley-warm-left",
    label: "暖色左",
    offsetX: 66,
    offsetY: 45,
    size: 9,
    ratio: 1.28,
    tone: "warm",
    intensity: 2.1,
  },
  {
    id: "alley-warm-right",
    label: "暖色右",
    offsetX: 82,
    offsetY: 44,
    size: 14,
    ratio: 1.5,
    tone: "warm",
    intensity: 1.8,
  },
  {
    id: "alley-door-warm",
    label: "扉・暖色",
    offsetX: 75,
    offsetY: 47,
    size: 23,
    ratio: 0.65,
    tone: "warm",
    intensity: 0.5,
  },
];

/**
 * ボケ専用光 15 点 — 定常状態には存在しない。移行完了で opacity 0 になり消える。
 * 白 4 / オレンジ 9 / ネオン 2
 *
 * 【書き込み場所】この START_BOKEH_ONLY_LAMP_GLOWS 配列
 * 位置: offsetX / offsetY
 * 形・強さ・色: size / ratio / intensity / tone / colorRgb
 */
export const START_BOKEH_ONLY_LAMP_GLOWS: StartBokehLampGlowConfig[] = [
  {
    id: "bokeh-only-white-1",
    label: "ボケ・白1",
    offsetX: 29,
    offsetY: 41,
    size: 3,
    ratio: 1,
    tone: "warm",
    colorRgb: "255, 255, 255",
    intensity: 0.95,
  },
  {
    id: "bokeh-only-white-2",
    label: "ボケ・白2",
    offsetX: 34,
    offsetY: 44,
    size: 6,
    ratio: 1,
    tone: "warm",
    colorRgb: "255, 255, 255",
    intensity: 0.9,
  },
  {
    id: "bokeh-only-white-3",
    label: "ボケ・白3",
    offsetX: 29,
    offsetY: 43,
    size: 2,
    ratio: 1,
    tone: "warm",
    colorRgb: "255, 255, 255",
    intensity: 1.5,
  },
  {
    id: "bokeh-only-white-4",
    label: "ボケ・白4",
    offsetX: 34,
    offsetY: 45,
    size: 3,
    ratio: 1,
    tone: "warm",
    colorRgb: "255, 255, 255",
    intensity: 1.5,
  },
  {
    id: "bokeh-only-orange-1",
    label: "ボケ・橙1",
    offsetX: 38,
    offsetY: 45,
    size: 3,
    ratio: 1,
    tone: "warm",
    intensity: 1,
  },
  {
    id: "bokeh-only-orange-2",
    label: "ボケ・橙2",
    offsetX: 37,
    offsetY: 27,
    size: 4,
    ratio: 1,
    tone: "warm",
    intensity: 0.85,
  },
  {
    id: "bokeh-only-orange-3",
    label: "ボケ・橙3",
    offsetX: 32,
    offsetY: 31,
    size: 3,
    ratio: 1,
    tone: "warm",
    intensity: 0.85,
  },
  {
    id: "bokeh-only-orange-4",
    label: "ボケ・橙4",
    offsetX: 40,
    offsetY: 31,
    size: 2,
    ratio: 1,
    tone: "warm",
    intensity: 0.7,
  },
  {
    id: "bokeh-only-orange-5",
    label: "ボケ・橙5",
    offsetX: 38,
    offsetY: 25,
    size: 2,
    ratio: 1,
    tone: "warm",
    intensity: 0.6,
  },
  {
    id: "bokeh-only-orange-6",
    label: "ボケ・橙6",
    offsetX: 37,
    offsetY: 29,
    size: 4,
    ratio: 1,
    tone: "warm",
    intensity: 0.9,
  },
  {
    id: "bokeh-only-orange-7",
    label: "ボケ・橙7",
    offsetX: 33,
    offsetY: 25,
    size: 5,
    ratio: 1,
    tone: "warm",
    intensity: 0.95,
  },
  {
    id: "bokeh-only-orange-8",
    label: "ボケ・橙8",
    offsetX: 71,
    offsetY: 47,
    size: 13,
    ratio: 0.4,
    tone: "warm",
    intensity: 0.35,
  },
  {
    id: "bokeh-only-orange-9",
    label: "ボケ・橙9",
    offsetX: 32,
    offsetY: 38,
    size: 6,
    ratio: 1,
    tone: "warm",
    intensity: 0.9,
  },
  {
    id: "bokeh-only-neon-1",
    label: "ボケ・ネオン1",
    offsetX: 38,
    offsetY: 43,
    size: 6,
    ratio: 1,
    tone: "neon",
    intensity: 0.9,
  },
  {
    id: "bokeh-only-neon-2",
    label: "ボケ・ネオン2",
    offsetX: 29,
    offsetY: 50,
    size: 4,
    ratio: 1,
    tone: "neon",
    intensity: 1.25,
  },
];
