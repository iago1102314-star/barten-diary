import { MOOD_CURTAIN } from "@/lib/entrance/mood-curtain";

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

/**
 * カメラポーズ — 奥ほど動きが小さく、手前ほど大きい（遠近法）。
 * pondering = マスターの下（カウンター）へ目線を落とす。
 */
export const COUNTER_CAMERA = {
  /** 幕の下ろしと同期 */
  transitionSec: MOOD_CURTAIN.dropDurationSec,
  /** 拡大の支点 — マスター胸元付近 */
  origin: "50% 34%",
  poses: {
    neutral: {
      back: { y: "0%", scale: 1 },
      glow: { y: "0%", scale: 1 },
      master: { y: "0%", scale: 1 },
      lantern: { y: "0%", scale: 1 },
      front: { y: "0%", scale: 1 },
      drink: { y: "0%", scale: 1 },
    },
    pondering: {
      back: { y: "-1.4%", scale: 1.018 },
      glow: { y: "-1.8%", scale: 1.022 },
      master: { y: "-3.2%", scale: 1.038 },
      lantern: { y: "-3.6%", scale: 1.042 },
      front: { y: "-5.2%", scale: 1.058 },
      drink: { y: "-5.8%", scale: 1.064 },
    },
  } satisfies Record<CameraPose, Record<CounterLayerId, LayerTransform>>,
} as const;

export function getLayerTransform(
  layer: CounterLayerId,
  pose: CameraPose,
): LayerTransform {
  return COUNTER_CAMERA.poses[pose][layer];
}
