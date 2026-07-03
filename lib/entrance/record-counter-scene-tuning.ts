import type { DrinkId } from "@/lib/drinks/drink-catalog";
import { resolveVisualDrinkId } from "@/lib/drinks/legacy-drink-map";

/**
 * 録音シーン — 見た目調整（このファイルだけ触れば OK）
 *
 * アセット対応:
 *   back    → `/assets/bar/back-record.webp`（店内の counter-back 相当）
 *   counter → `/assets/bar/counter-record.webp`（店内の counter-front 相当）
 *
 * ═══════════════════════════════════════════════════════════
 *  back / counter（背景・カウンター画像）
 * ═══════════════════════════════════════════════════════════
 *  panXPercent   画面に対して横移動。+ で右、− で左（例: 5）
 *  panYPercent   画面に対して縦移動。+ で下、− で上（例: -3）
 *  zoom          画角の倍率（カメラのズームに近い）
 *                1 = object-cover 基準 / 0.8 = 引いて広く見える / 1.2 = 寄ってトリミング
 *                画面端に余白は出ない（object-cover のまま枠いっぱいに敷く）
 *
 * ═══════════════════════════════════════════════════════════
 *  drink（グラス — カウンター layer 基準）
 * ═══════════════════════════════════════════════════════════
 *  酒ごと → RECORD_DRINK_PLACEMENT_BY_KEY（下記）
 *    xPercent / yPercent     座標（+ で右・下）
 *    sizePercent / maxWidthPx  大きさ
 *    opacity                 不透明度 0〜1
 *
 *  共通（通常は触らない）→ RECORD_DRINK_SHARED
 *    zoom / aspectRatio / objectFit / objectPosition
 *
 *  ※ カウンター画像を動かす → counter の panX / panY
 *  ※ 背景を動かす → back の panX / panY
 */

/** 背景・カウンター画像 — 画面基準 */
export type RecordSceneImageTuning = {
  panXPercent: number;
  panYPercent: number;
  zoom: number;
};

/** 酒ごとに触るパラメータ */
export type RecordDrinkPlacementOverride = {
  xPercent: number;
  yPercent: number;
  sizePercent: number;
  maxWidthPx: number;
  opacity: number;
};

/** グラス — カウンター layer 基準（画面基準ではない） */
export type RecordSceneDrinkTuning = RecordDrinkPlacementOverride & {
  zoom: number;
  aspectRatio: number;
  objectFit: "contain" | "cover";
  objectPosition: string;
};

/** @deprecated RecordSceneImageTuning を使用 */
export type RecordSceneLayerTuning = RecordSceneImageTuning;

/** 将来の酒ごと微調整用キー（β版4種） */
export type RecordDrinkPlacementKey =
  | "old-fashioned"
  | "koshu"
  | "bellini"
  | "hot-cocoa";

/**
 * カウンター調整中は false のまま。
 * back / counter の位置が決まったら true にしてグラスを表示する。
 */
export const RECORD_COUNTER_SHOW_DRINK = true;

export const RECORD_COUNTER_SCENE_TUNING = {
  back: {
    panXPercent: 0,
    panYPercent: -1,
    zoom: 1,
  },
  counter: {
    panXPercent: 0,
    panYPercent: 8,
    zoom: 1,
  },
} as const satisfies {
  back: RecordSceneImageTuning;
  counter: RecordSceneImageTuning;
};

/** 全ドリンク共通 — 通常は触らない */
export const RECORD_DRINK_SHARED = {
  zoom: 3.5,
  aspectRatio: 0.68,
  objectFit: "contain",
  objectPosition: "50% 88%",
} as const satisfies Pick<
  RecordSceneDrinkTuning,
  "zoom" | "aspectRatio" | "objectFit" | "objectPosition"
>;

/**
 * 酒ごとの座標・大きさ・不透明度（ここだけ触れば OK）
 * 未記載の酒は old-fashioned と同じ値になる
 */
export const RECORD_DRINK_PLACEMENT_BY_KEY = {
  "old-fashioned": {
    xPercent: 50,
    yPercent: 56,
    sizePercent: 18,
    maxWidthPx: 118,
    opacity: 0.9,
  },
  koshu: {
    xPercent: 50,
    yPercent: 47,
    sizePercent: 24,
    maxWidthPx: 118,
    opacity: 0.9,
  },
  bellini: {
    xPercent: 50,
    yPercent: 31,
    sizePercent: 34,
    maxWidthPx: 1000,
    opacity: 0.9,
  },
  "hot-cocoa": {
    xPercent: 50,
    yPercent: 50.5,
    sizePercent: 28,
    maxWidthPx: 1000,
    opacity: 0.9,
  },
} as const satisfies Record<RecordDrinkPlacementKey, RecordDrinkPlacementOverride>;

function buildRecordDrinkTuning(
  override: RecordDrinkPlacementOverride,
): RecordSceneDrinkTuning {
  return { ...RECORD_DRINK_SHARED, ...override };
}

const DRINK_BY_KEY: Record<RecordDrinkPlacementKey, RecordSceneDrinkTuning> = {
  "old-fashioned": buildRecordDrinkTuning(
    RECORD_DRINK_PLACEMENT_BY_KEY["old-fashioned"],
  ),
  koshu: buildRecordDrinkTuning(RECORD_DRINK_PLACEMENT_BY_KEY.koshu),
  bellini: buildRecordDrinkTuning(RECORD_DRINK_PLACEMENT_BY_KEY.bellini),
  "hot-cocoa": buildRecordDrinkTuning(
    RECORD_DRINK_PLACEMENT_BY_KEY["hot-cocoa"],
  ),
};

export function recordSceneImagePanStyle(
  tuning: RecordSceneImageTuning,
): { transform: string } | undefined {
  if (tuning.panXPercent === 0 && tuning.panYPercent === 0) {
    return undefined;
  }

  return {
    transform: `translate(${tuning.panXPercent}%, ${tuning.panYPercent}%)`,
  };
}

/**
 * object-cover の画角を変えるズーム。
 * 単純 scale だと同じ切り抜きを縮小するだけなので、
 * 枠サイズを 1/zoom にしてから scale(zoom) し、常に画面を覆う。
 */
export function recordSceneImageZoomFrameStyle(
  zoom: number,
): {
  position: "absolute";
  inset?: 0;
  left?: string;
  top?: string;
  width?: string;
  height?: string;
  transform?: string;
  transformOrigin: "center center";
} {
  if (zoom === 1) {
    return {
      position: "absolute",
      inset: 0,
      transformOrigin: "center center",
    };
  }

  const safeZoom = Math.max(zoom, 0.01);

  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: `${100 / safeZoom}%`,
    height: `${100 / safeZoom}%`,
    transform: `translate(-50%, -50%) scale(${safeZoom})`,
    transformOrigin: "center center",
  };
}

/** @deprecated recordSceneImagePanStyle + recordSceneImageZoomFrameStyle を使用 */
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

  const safeZoom = Math.max(tuning.zoom, 0.01);

  return {
    transform: `translate(${tuning.panXPercent}%, ${tuning.panYPercent}%) translate(-50%, -50%) scale(${safeZoom})`,
    transformOrigin: "center center",
  };
}

/** β版4種 — 未登録 ID は old-fashioned にフォールバック */
export function resolveRecordDrinkPlacementKey(
  drinkId: DrinkId | null | undefined,
): RecordDrinkPlacementKey {
  const visualId = resolveVisualDrinkId(drinkId);
  if (
    visualId === "koshu" ||
    visualId === "bellini" ||
    visualId === "hot-cocoa" ||
    visualId === "old-fashioned"
  ) {
    return visualId;
  }
  return "old-fashioned";
}

export function getRecordDrinkPlacement(
  key: RecordDrinkPlacementKey,
): RecordSceneDrinkTuning {
  return DRINK_BY_KEY[key];
}
