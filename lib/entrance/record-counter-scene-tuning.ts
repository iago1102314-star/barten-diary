import type { DrinkId } from "@/lib/drinks/drink-catalog";

/**
 * 録音シーン — 見た目調整（このファイルだけ触れば OK）
 *
 * ═══════════════════════════════════════════════════════════
 *  back / counter（背景・カウンター画像）
 * ═══════════════════════════════════════════════════════════
 *  panXPercent   画面に対して横移動。+ で右、− で左（例: 5）
 *  panYPercent   画面に対して縦移動。+ で下、− で上（例: -3）
 *  zoom          倍率。1 = そのまま / 0.95 = 少し縮小 / 1.05 = 少し拡大
 *                縮小した余白は下のレイヤーが見える（色付きの枠は出ない）
 *
 * ═══════════════════════════════════════════════════════════
 *  drink（グラス — カウンター layer 基準）
 * ═══════════════════════════════════════════════════════════
 *  xPercent      カウンター上の横位置。+ で右（例: 48）
 *  yPercent      カウンター上の縦位置。+ で下（例: 55）
 *  sizePercent   グラスの大きさ（カウンター幅の %）
 *  maxWidthPx    大画面での幅上限
 *  zoom          グラス倍率。1 = そのまま（x/y の位置を中心に拡大縮小）
 *  opacity       不透明度 0〜1
 *
 *  ※ グラスを動かす → xPercent / yPercent だけ触る
 *  ※ カウンター画像を動かす → counter の panX / panY
 *  ※ 背景を動かす → back の panX / panY
 */

/** 背景・カウンター画像 — 画面基準 */
export type RecordSceneImageTuning = {
  panXPercent: number;
  panYPercent: number;
  zoom: number;
};

/** グラス — カウンター layer 基準（画面基準ではない） */
export type RecordSceneDrinkTuning = {
  xPercent: number;
  yPercent: number;
  sizePercent: number;
  maxWidthPx: number;
  zoom: number;
  opacity: number;
  aspectRatio: number;
  objectFit: "contain" | "cover";
  objectPosition: string;
};

/** @deprecated RecordSceneImageTuning を使用 */
export type RecordSceneLayerTuning = RecordSceneImageTuning;

/** 将来の酒ごと微調整用キー */
export type RecordDrinkPlacementKey =
  | "old-fashioned"
  | "negroni"
  | "gin-tonic"
  | "bellini"
  | "wine"
  | "yamazaki";

export const RECORD_COUNTER_SCENE_TUNING = {
  back: {
    panXPercent: 0,
    panYPercent: 0,
    zoom: 0.9,
  },
  counter: {
    panXPercent: 0,
    panYPercent: 12,
    zoom: 1,
  },
  drink: {
    xPercent: 47,
    yPercent: 54,
    sizePercent: 24,
    maxWidthPx: 118,
    zoom: 3.5,
    opacity: 0.9,
    aspectRatio: 0.68,
    objectFit: "contain",
    objectPosition: "50% 88%",
  },
} as const satisfies {
  back: RecordSceneImageTuning;
  counter: RecordSceneImageTuning;
  drink: RecordSceneDrinkTuning;
};

const DRINK_BY_KEY: Record<RecordDrinkPlacementKey, RecordSceneDrinkTuning> = {
  "old-fashioned": RECORD_COUNTER_SCENE_TUNING.drink,
  negroni: RECORD_COUNTER_SCENE_TUNING.drink,
  "gin-tonic": RECORD_COUNTER_SCENE_TUNING.drink,
  bellini: RECORD_COUNTER_SCENE_TUNING.drink,
  wine: RECORD_COUNTER_SCENE_TUNING.drink,
  yamazaki: RECORD_COUNTER_SCENE_TUNING.drink,
};

export function recordSceneImageTransformStyle(
  tuning: RecordSceneImageTuning,
): { transform: string; transformOrigin: "center center" } | undefined {
  if (
    tuning.panXPercent === 0 &&
    tuning.panYPercent === 0 &&
    tuning.zoom === 1
  ) {
    return undefined;
  }

  return {
    transform: `translate(${tuning.panXPercent}%, ${tuning.panYPercent}%) scale(${tuning.zoom})`,
    transformOrigin: "center center",
  };
}

/** 現状は全カテゴリ old-fashoned.webp */
export function resolveRecordDrinkPlacementKey(
  _drinkId: DrinkId | null | undefined,
): RecordDrinkPlacementKey {
  return "old-fashioned";
}

export function getRecordDrinkPlacement(
  key: RecordDrinkPlacementKey,
): RecordSceneDrinkTuning {
  return DRINK_BY_KEY[key];
}
