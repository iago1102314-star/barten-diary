import { MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC } from "@/lib/entrance/mood-select-entrance-tuning";

/** カウンター奥 → 手前のレイヤー ID */
export type CounterLayerId =
  | "back"
  | "glow"
  | "master"
  | "lantern"
  | "front"
  | "drink";

export type CameraPose = "neutral" | "pondering";

type LayerTransform = {
  /** 視線を下へ — レイヤーを上にずらす（%） */
  y: string;
  scale: number;
};

// ─── counter-front 位置調整（ここを触る）────────────────────────────────────
/**
 * counter-front — 店内通常（neutral）の translateY（%）
 * 正 = 下、負 = 上
 */
export const COUNTER_FRONT_NEUTRAL_Y_PERCENT = 23.5;

/**
 * counter-front — 気分選択（pondering）の translateY（%）
 * 正 = 下、負 = 上。値を大きくするほど（例: -18 → -10 → 0）カウンターが下がる
 */
export const COUNTER_FRONT_PONDERING_Y_PERCENT = -10;

/**
 * counter-front — 気分選択時のズーム基準（1 = 等倍）
 * 実際の scale = 1 + (この値 - 1) × PONDERING_ZOOM_AMOUNT_SCALE
 */
export const COUNTER_FRONT_PONDERING_BASE_SCALE = 1.46;

/** pondering 全体のズーム量（neutral=1 からの差分）の倍率 */
export const PONDERING_ZOOM_AMOUNT_SCALE = 0.75;

/** パララックス拡大の支点 — マスター胸元付近（%） */
export const COUNTER_CAMERA_ORIGIN = "50% 34%";

// ─── その他レイヤー（pondering）──────────────────────────────────────────────
const PONDERING_LAYER_Y = {
  back: -14,
  glow: -18,
  master: -32,
  lantern: -38,
} as const;

const PONDERING_LAYER_BASE_SCALE = {
  back: 1.12,
  glow: 1.16,
  master: 1.28,
  lantern: 1.36,
} as const;

function percentY(value: number): string {
  return `${value}%`;
}

/** neutral からの拡大量を scale 倍率に反映 */
function ponderingScale(baseScale: number): number {
  return 1 + (baseScale - 1) * PONDERING_ZOOM_AMOUNT_SCALE;
}

/**
 * カメラポーズ — 奥ほど動きが小さく、手前ほど大きい（遠近法）。
 * pondering = 視線をカウンターへ落とす（気分選択 UX）。
 */
export const COUNTER_CAMERA = {
  /** 気分選択 pondering — 黒ビネットと同時完了 */
  transitionSec: MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC,
  origin: COUNTER_CAMERA_ORIGIN,
  poses: {
    neutral: {
      back: { y: "0%", scale: 1 },
      glow: { y: "0%", scale: 1 },
      master: { y: "0%", scale: 1 },
      lantern: { y: "0%", scale: 1 },
      front: {
        y: percentY(COUNTER_FRONT_NEUTRAL_Y_PERCENT),
        scale: 1,
      },
      drink: { y: "0%", scale: 1 },
    },
    pondering: {
      back: {
        y: percentY(PONDERING_LAYER_Y.back),
        scale: ponderingScale(PONDERING_LAYER_BASE_SCALE.back),
      },
      glow: {
        y: percentY(PONDERING_LAYER_Y.glow),
        scale: ponderingScale(PONDERING_LAYER_BASE_SCALE.glow),
      },
      master: {
        y: percentY(PONDERING_LAYER_Y.master),
        scale: ponderingScale(PONDERING_LAYER_BASE_SCALE.master),
      },
      lantern: {
        y: percentY(PONDERING_LAYER_Y.lantern),
        scale: ponderingScale(PONDERING_LAYER_BASE_SCALE.lantern),
      },
      front: {
        y: percentY(COUNTER_FRONT_PONDERING_Y_PERCENT),
        scale: ponderingScale(COUNTER_FRONT_PONDERING_BASE_SCALE),
      },
      drink: {
        y: percentY(COUNTER_FRONT_PONDERING_Y_PERCENT),
        scale: ponderingScale(COUNTER_FRONT_PONDERING_BASE_SCALE),
      },
    },
  } satisfies Record<CameraPose, Record<CounterLayerId, LayerTransform>>,
} as const;

export function getLayerTransform(
  layer: CounterLayerId,
  pose: CameraPose,
): LayerTransform {
  return COUNTER_CAMERA.poses[pose][layer];
}

/** counter-front 下辺が画面下を割らない y の目安（pondering 用） */
export function maxPonderingFrontYPercent(scale: number): number {
  return 0.66 * (1 / scale - 1) * 100;
}
